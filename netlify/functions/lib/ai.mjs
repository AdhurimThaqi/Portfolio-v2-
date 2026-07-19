/* Shared AI provider logic — used by generate.mjs (admin letters/resumes) and
   assistant.mjs (public portfolio Q&A).

   Default: Anthropic (ANTHROPIC_API_KEY / ANTHROPIC_MODEL).
   AI_PROVIDER=openai routes to any OpenAI-compatible /chat/completions endpoint
   (Hugging Face, Groq, Together, OpenRouter, OpenAI) via
   AI_API_KEY / AI_BASE_URL / AI_MODEL. */
export function providerConfig() {
  const provider = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  if (provider === "openai" || provider === "openai-compatible") {
    return {
      provider: "openai",
      apiKey: process.env.AI_API_KEY,
      baseUrl: (process.env.AI_BASE_URL || "https://router.huggingface.co/v1").replace(/\/+$/, ""),
      model: process.env.AI_MODEL || "meta-llama/Llama-3.3-70B-Instruct",
    };
  }
  return {
    provider: "anthropic",
    apiKey: process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY,
    model: process.env.ANTHROPIC_MODEL || process.env.AI_MODEL || "claude-opus-4-8",
  };
}

/* Calls the model and returns raw text. Throws { status, detail } on a non-2xx
   response; propagates AbortError on timeout. `maxTokens` defaults to 6000. */
export async function callModel(cfg, system, user, signal, maxTokens = 6000) {
  if (cfg.provider === "anthropic") {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal,
      headers: {
        "x-api-key": cfg.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!resp.ok) throw { status: resp.status, detail: await resp.text().catch(() => "") };
    const data = await resp.json();
    return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  }

  const resp = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    signal,
    headers: { authorization: `Bearer ${cfg.apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!resp.ok) throw { status: resp.status, detail: await resp.text().catch(() => "") };
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}
