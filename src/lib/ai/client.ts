import Anthropic from "@anthropic-ai/sdk";
import { alertOwner, logError } from "@/lib/monitoring";

// AI features are optional. Anthropic's Claude (pay as you go) is used when ANTHROPIC_API_KEY is set,
// with Google's Gemini (free key from https://aistudio.google.com, GEMINI_API_KEY) as the backup when
// Claude fails; either one alone also works, and with neither the features are switched off. The AI
// modules only ever call generateText(), so the provider can change without touching them.

// Haiku is plenty for pulling fields out of a job advert or an email, and costs about $0.10 per million
// input tokens. CLAUDE_MODEL switches it (for example to claude-sonnet-5-5 for better CV reviews).
const DEFAULT_CLAUDE_MODEL = "claude-haiku-5-5";
// Haiku thinks before answering by default, and those tokens count towards max_tokens: leave room for them.
const CLAUDE_THINKING_HEADROOM = 2048;

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
// Tried in order when the first model is busy (the free tier often returns "high demand" for the newest one)
// or has been retired (Google occasionally 404s an older model name and points at a newer one).
const FALLBACK_GEMINI_MODELS = ["gemini-3.7-flash", "gemini-3.6-flash"];
const REQUEST_TIMEOUT_MS = 60_000;
const ROUNDS = 2;
// Reasons to try the next model rather than give up: busy, rate-limited, or a model name Google
// has retired (404) — none of these are the user's fault, and another model may still work.
const RETRY_NEXT_MODEL_STATUSES = new Set([404, 429, 503]);

export class AiNotConfiguredError extends Error {
  constructor() {
    super("No AI key is set. AI features are unavailable. Add ANTHROPIC_API_KEY or GEMINI_API_KEY to .env to enable them.");
    this.name = "AiNotConfiguredError";
  }
}

/** Raised when the AI service itself fails. The message is safe to show (it never contains the key). */
export class AiRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiRequestError";
  }
}

const geminiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

export function isAiConfigured() {
  return Boolean(geminiKey() || process.env.ANTHROPIC_API_KEY);
}

interface GenerateOptions {
  /** Ask for a JSON object back (the model is switched into JSON mode). */
  json?: boolean;
  /** Upper bound on the reply length, in tokens. */
  maxTokens: number;
}

export async function generateText(prompt: string, { json = false, maxTokens }: GenerateOptions): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await generateWithClaude(prompt, maxTokens);
    } catch (error) {
      // Claude is down, busy or over its spend limit: try the free Gemini key before giving up.
      if (!(error instanceof AiRequestError) || !geminiKey()) throw error;
    }
  }
  if (geminiKey()) return generateWithGemini(prompt, json, maxTokens);
  throw new AiNotConfiguredError();
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
}

async function generateWithGemini(prompt: string, json: boolean, maxTokens: number): Promise<string> {
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      // Gemini's own "thinking" tokens count towards this limit, so leave generous room on top of the reply.
      maxOutputTokens: maxTokens + 4096,
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
  });

  const models = [...new Set([process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL, ...FALLBACK_GEMINI_MODELS])];
  let response: Response | undefined;

  outer: for (let round = 0; round < ROUNDS; round++) {
    for (const model of models) {
      try {
        response = await fetch(`${GEMINI_ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
          method: "POST",
          // The key goes in a header, never in the URL, so it can't leak into logs or error messages.
          headers: { "content-type": "application/json", "x-goog-api-key": geminiKey() },
          body,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (error) {
        // A network-level failure (timeout, DNS, a dropped connection) rather than an HTTP error —
        // try the next model instead of giving up immediately; a different endpoint may still answer.
        logError("Gemini request", error, { model, round });
        response = undefined;
        continue;
      }
      if (!RETRY_NEXT_MODEL_STATUSES.has(response.status)) break outer;
      logError("Gemini request", new Error(`HTTP ${response.status}, trying the next model`), { model, round });
    }
    if (round < ROUNDS - 1) await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  if (!response) {
    await alertAiOutage("no response from any Gemini model (network errors or timeouts)");
    throw new AiRequestError("The AI service didn't respond. Please try again in a moment.");
  }
  if (!response.ok) {
    const status = response.status;
    // The body is Google's error description (never the key, which goes in a header).
    const detail = (await response.text().catch(() => "")).slice(0, 500);
    logError("Gemini request", new Error(`HTTP ${status}`), { detail });
    await alertAiOutage(
      status === 429
        ? "Gemini returned 429 for every model: the API key's quota is used up."
        : status === 400 || status === 401 || status === 403
          ? `Gemini rejected the request (HTTP ${status}). The API key may be invalid, restricted or out of credit.\n\n${detail}`
          : `Gemini is failing (HTTP ${status}).\n\n${detail}`
    );
    if (status === 429) throw new AiRequestError("The free AI allowance is used up for the moment. Please try again in a minute.");
    if (status === 400 || status === 401 || status === 403) {
      throw new AiRequestError("The AI service rejected the request. Check that GEMINI_API_KEY in .env is valid.");
    }
    throw new AiRequestError("The AI service is unavailable right now. Please try again in a moment.");
  }

  const data = (await response.json()) as GeminiResponse;
  if (data.promptFeedback?.blockReason) throw new AiRequestError("The AI service declined to process that text.");
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter((part) => !part.thought).map((part) => part.text ?? "").join("");
  if (!text.trim()) throw new AiRequestError("The AI service returned an empty answer. Please try again.");
  return text;
}

async function generateWithClaude(prompt: string, maxTokens: number): Promise<string> {
  // The SDK already retries busy (429/529) and dropped requests twice with backoff.
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: REQUEST_TIMEOUT_MS });
  const model = process.env.CLAUDE_MODEL || DEFAULT_CLAUDE_MODEL;
  let message;
  try {
    message = await client.messages.create({
      model,
      max_tokens: maxTokens + CLAUDE_THINKING_HEADROOM,
      // Low effort: these are extraction tasks, so keep thinking (and its cost) short.
      output_config: { effort: "low" },
      messages: [{ role: "user", content: prompt }],
    });
  } catch (error) {
    const status = error instanceof Anthropic.APIError ? error.status : undefined;
    logError("Claude request", error, { model, status });
    const rejected = status === 400 || status === 401 || status === 403;
    await alertOwner(
      "ai-outage-claude",
      "Claude requests are failing",
      `The Claude API request failed${status ? ` (HTTP ${status})` : ""}: ${error instanceof Error ? error.message : String(error)}` +
        (rejected ? "\n\nThe API key may be invalid or revoked, or the account may have hit its monthly spend limit or run out of credit (console.anthropic.com → Billing)." : "") +
        (geminiKey() ? "\n\nGradPonto is falling back to Gemini meanwhile." : "\n\nAnalyse a Job, the Application Reviewer and Email import are affected until it recovers.")
    );
    if (status === 429) throw new AiRequestError("The AI service is busy right now. Please try again in a minute.");
    if (rejected) throw new AiRequestError("The AI service rejected the request. Check that ANTHROPIC_API_KEY is valid and has credit.");
    throw new AiRequestError("The AI service is unavailable right now. Please try again in a moment.");
  }
  if (message.stop_reason === "refusal") throw new AiRequestError("The AI service declined to process that text.");
  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
  if (!text.trim()) throw new AiRequestError("The AI service returned an empty answer. Please try again.");
  return text;
}

// Models are told to return raw JSON, but sometimes wrap it in a ```json fence anyway — strip that before parsing.
export function extractJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new AiRequestError("The AI answer wasn't in the expected format. Please try again.");
  }
}

// One alert an hour at most (lib/monitoring.ts throttles by key): every AI feature fails at once
// when the provider does, and the owner needs to hear about it once, not once per user.
function alertAiOutage(details: string) {
  return alertOwner("ai-outage", "AI requests are failing", `${details}\n\nAnalyse a Job, the Application Reviewer and Email import are affected until it recovers.`);
}
