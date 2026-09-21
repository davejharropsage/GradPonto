import Anthropic from "@anthropic-ai/sdk";

// AI features are optional. Google's Gemini (free key from https://aistudio.google.com) is used when
// GEMINI_API_KEY is set; otherwise Anthropic's Claude if ANTHROPIC_API_KEY is set; otherwise the
// features are switched off. The three AI modules only ever call generateText(), so the provider
// can change without touching them.

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
// Tried in order when the first model is busy (the free tier often returns "high demand" for the newest one).
const FALLBACK_GEMINI_MODELS = ["gemini-3.7-flash", "gemini-2.5-flash"];
const REQUEST_TIMEOUT_MS = 60_000;
const ROUNDS = 2;

export class AiNotConfiguredError extends Error {
  constructor() {
    super("No AI key is set. AI features are unavailable. Add GEMINI_API_KEY to .env to enable them.");
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
  if (geminiKey()) return generateWithGemini(prompt, json, maxTokens);
  if (process.env.ANTHROPIC_API_KEY) return generateWithClaude(prompt, maxTokens);
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
  for (let round = 0; round < ROUNDS; round++) {
    for (const model of models) {
      try {
        response = await fetch(`${GEMINI_ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
          method: "POST",
          // The key goes in a header, never in the URL, so it can't leak into logs or error messages.
          headers: { "content-type": "application/json", "x-goog-api-key": geminiKey() },
          body,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch {
        throw new AiRequestError("The AI service didn't respond. Please try again in a moment.");
      }
      // "Busy" (503) or briefly rate-limited (429): move on to the next model.
      if (response.status !== 429 && response.status !== 503) break;
    }
    if (response && response.status !== 429 && response.status !== 503) break;
    if (round < ROUNDS - 1) await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  if (!response || !response.ok) {
    const status = response?.status;
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
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const block = message.content.find((item) => item.type === "text");
  return block?.type === "text" ? block.text : "";
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
