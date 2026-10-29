import Anthropic from "@anthropic-ai/sdk";
import { alertOwner, logError } from "@/lib/monitoring";

// AI features are optional: they use Anthropic's Claude (pay as you go) when ANTHROPIC_API_KEY is set,
// and are switched off otherwise. There's deliberately no free fallback provider: free tiers may use
// what's sent to them to train models, which the privacy policy rules out for users' CVs and emails.
// The AI modules only ever call generateText(), so the provider can change without touching them.

// Haiku is plenty for pulling fields out of a job advert or an email, and costs about $0.10 per million
// input tokens. CLAUDE_MODEL switches it (for example to claude-sonnet-5-5 for better CV reviews).
const DEFAULT_CLAUDE_MODEL = "claude-haiku-5-5";
// Haiku thinks before answering by default, and those tokens count towards max_tokens: leave room for them.
const CLAUDE_THINKING_HEADROOM = 2048;

const REQUEST_TIMEOUT_MS = 60_000;

export class AiNotConfiguredError extends Error {
  constructor() {
    super("No AI key is set. AI features are unavailable. Add ANTHROPIC_API_KEY to .env to enable them.");
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

export function isAiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

interface GenerateOptions {
  /** Upper bound on the reply length, in tokens. */
  maxTokens: number;
}

export async function generateText(prompt: string, { maxTokens }: GenerateOptions): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) throw new AiNotConfiguredError();
  return generateWithClaude(prompt, maxTokens);
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
        "\n\nAnalyse a Job, the Application Reviewer and Email import are affected until it recovers."
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
