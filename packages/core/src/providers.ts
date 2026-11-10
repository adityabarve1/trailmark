/**
 * Direct, device-to-provider LLM calls. The user's API key goes from this device
 * straight to the provider; it is never sent to Trailmark's servers or database.
 */
export type ProviderId = "anthropic" | "openai" | "gemini" | "openrouter" | "groq";

export interface ProviderInfo {
  id: ProviderId;
  name: string;
  keyHint: string;
  keyUrl: string;
  defaultModel: string;
  models: string[];
}

// Model names change often: these are suggestions, and the user can type any model id.
export const PROVIDERS: ProviderInfo[] = [
  { id: "anthropic", name: "Claude (Anthropic)", keyHint: "sk-ant-…", keyUrl: "https://console.anthropic.com/settings/keys", defaultModel: "claude-sonnet-5-5", models: ["claude-sonnet-5-5", "claude-opus-5-5", "claude-haiku-5-5"] },
  { id: "openai", name: "ChatGPT (OpenAI)", keyHint: "sk-…", keyUrl: "https://platform.openai.com/api-keys", defaultModel: "gpt-4.1", models: ["gpt-4.1", "gpt-4.1-mini", "o4-mini"] },
  { id: "gemini", name: "Gemini (Google)", keyHint: "AIza…", keyUrl: "https://aistudio.google.com/app/apikey", defaultModel: "gemini-2.5-pro", models: ["gemini-2.5-pro", "gemini-2.5-flash"] },
  { id: "openrouter", name: "OpenRouter (many models)", keyHint: "sk-or-…", keyUrl: "https://openrouter.ai/keys", defaultModel: "anthropic/claude-sonnet-4.5", models: ["anthropic/claude-sonnet-4.5", "openai/gpt-4.1", "google/gemini-2.5-pro"] },
  { id: "groq", name: "Groq (Llama)", keyHint: "gsk_…", keyUrl: "https://console.groq.com/keys", defaultModel: "llama-3.3-70b-versatile", models: ["llama-3.3-70b-versatile"] },
];
export const providerInfo = (id: ProviderId) => PROVIDERS.find((p) => p.id === id)!;

export interface ChatMessage { role: "user" | "assistant"; content: string }
export interface ChatResult { text: string; truncated: boolean }

export class ProviderError extends Error {
  constructor(message: string, public status?: number) { super(message); }
}

const MAX_OUT = 16000;

async function post(url: string, headers: Record<string, string>, body: unknown, signal?: AbortSignal) {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body), signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ProviderError("Couldn’t reach the provider. Check your connection and try again.");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (json as { error?: { message?: string } })?.error?.message ?? res.statusText;
    if (res.status === 401 || res.status === 403) throw new ProviderError("The provider rejected your API key. Check it in Settings → AI keys.", res.status);
    if (res.status === 429) throw new ProviderError("Rate limit or quota reached on your provider account. Wait a minute or check your billing.", res.status);
    if (res.status === 404) throw new ProviderError(`Model not found: ${detail}. Pick another model in the dropdown.`, res.status);
    throw new ProviderError(`Provider error (${res.status}): ${detail}`, res.status);
  }
  return json as Record<string, unknown>;
}

function openAiCompatible(base: string, extraHeaders: Record<string, string> = {}) {
  return async (key: string, model: string, system: string, messages: ChatMessage[], signal?: AbortSignal): Promise<ChatResult> => {
    const j = await post(`${base}/chat/completions`, { authorization: `Bearer ${key}`, ...extraHeaders },
      { model, messages: [{ role: "system", content: system }, ...messages], max_tokens: MAX_OUT }, signal);
    const choice = (j.choices as { message?: { content?: string }; finish_reason?: string }[] | undefined)?.[0];
    return { text: choice?.message?.content ?? "", truncated: choice?.finish_reason === "length" };
  };
}

const CALLERS: Record<ProviderId, (key: string, model: string, system: string, messages: ChatMessage[], signal?: AbortSignal) => Promise<ChatResult>> = {
  anthropic: async (key, model, system, messages, signal) => {
    const j = await post("https://api.anthropic.com/v1/messages",
      { "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      { model, system, messages, max_tokens: MAX_OUT }, signal);
    const text = ((j.content as { type: string; text?: string }[]) ?? []).filter((b) => b.type === "text").map((b) => b.text).join("");
    return { text, truncated: j.stop_reason === "max_tokens" };
  },
  openai: async (key, model, system, messages, signal) => {
    const j = await post("https://api.openai.com/v1/chat/completions", { authorization: `Bearer ${key}` },
      { model, messages: [{ role: "system", content: system }, ...messages], max_completion_tokens: MAX_OUT }, signal);
    const choice = (j.choices as { message?: { content?: string }; finish_reason?: string }[] | undefined)?.[0];
    return { text: choice?.message?.content ?? "", truncated: choice?.finish_reason === "length" };
  },
  gemini: async (key, model, system, messages, signal) => {
    const j = await post(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      { "x-goog-api-key": key },
      {
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: MAX_OUT },
      }, signal);
    const cand = (j.candidates as { content?: { parts?: { text?: string }[] }; finishReason?: string }[] | undefined)?.[0];
    return { text: (cand?.content?.parts ?? []).map((p) => p.text ?? "").join(""), truncated: cand?.finishReason === "MAX_TOKENS" };
  },
  openrouter: openAiCompatible("https://openrouter.ai/api/v1", { "x-title": "Trailmark" }),
  groq: openAiCompatible("https://api.groq.com/openai/v1"),
};

export function chat(provider: ProviderId, key: string, model: string, system: string, messages: ChatMessage[], signal?: AbortSignal) {
  return CALLERS[provider](key, model, system, messages, signal);
}

/** Cheap call used by "Test key" in Settings. */
export async function testKey(provider: ProviderId, key: string, model: string): Promise<void> {
  await chat(provider, key, model, "Reply with the single word OK.", [{ role: "user", content: "Say OK" }]);
}
