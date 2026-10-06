// Run privately during a diagnostic build. Never print keys, prompts, or upstream bodies.
const key = process.env.GEMINI_API_KEY?.trim();
const base = "https://generativelanguage.googleapis.com";
async function probe(path, body, label) {
  try {
    const response = await fetch(base + path, {
      method: body ? "POST" : "GET",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(12000),
    });
    let data; try { data = await response.json(); } catch {}
    const code = data?.error?.status || data?.error?.code;
    console.log("GEMINI_DIAGNOSTIC " + JSON.stringify({ label, status: response.status,
      ...(typeof code === "string" && /^[A-Za-z_]+$/.test(code) ? { code } : {}) }));
    return { ok: response.ok, data };
  } catch { console.log("GEMINI_DIAGNOSTIC " + JSON.stringify({ label, status: "timeout_or_network" })); return { ok: false }; }
}
(async () => {
  if (!key) throw new Error("KEY_MISSING");
  const listed = await probe("/v1beta/models", null, "models");
  const names = new Set(listed.data?.models?.map(m => m.name.replace(/^models\//, "")) || []);
  const models = [...new Set([process.env.GEMINI_MODEL || "gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash"])];
  console.log("GEMINI_DIAGNOSTIC " + JSON.stringify({ available: models.filter(m => names.has(m)) }));
  for (const model of models) {
    if (model !== models[0] && !names.has(model)) continue;
    const input = [{ type: "user_input", content: [{ type: "text", text: "Reply with exactly EDUSPHERE_GEMINI_OK." }] }];
    const result = await probe("/v1/interactions", { model, input, store: false, generation_config: { max_output_tokens: 128 } }, model + ":v1");
    if (result.ok) console.log("GEMINI_DIAGNOSTIC " + JSON.stringify({ model, validSteps: Array.isArray(result.data?.steps) }));
    if (model === models[0] || !result.ok) {
      await probe("/v1beta/interactions", { model, input, store: false, generation_config: { max_output_tokens: 128 } }, model + ":v1beta");
      await probe("/v1beta/models/" + model + ":generateContent", { contents: [{ role: "user", parts: [{ text: "Reply with exactly EDUSPHERE_GEMINI_OK." }] }], generationConfig: { maxOutputTokens: 128 } }, model + ":generateContent");
    }
  }
  // Intentionally prevent this diagnostic build from replacing the live application.
  process.exitCode = 1;
})().catch(() => { console.error("GEMINI_DIAGNOSTIC failed"); process.exitCode = 1; });
