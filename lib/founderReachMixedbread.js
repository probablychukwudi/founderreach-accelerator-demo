const MIXEDBREAD_BASE_URL = "https://api.mixedbread.com/v1";

export function hasMixedbread(env = process.env) {
  return Boolean(String(env.MIXEDBREAD_API_KEY || "").trim());
}

export async function rerankWithMixedbread(
  query,
  input = [],
  { topK = 8, returnInput = false } = {},
  env = process.env
) {
  const apiKey = String(env.MIXEDBREAD_API_KEY || "").trim();
  if (!apiKey) throw new Error("Mixedbread is not configured.");

  const response = await fetch(`${MIXEDBREAD_BASE_URL}/reranking`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mixedbread-ai/mxbai-rerank-large-v2",
      query,
      input,
      top_k: topK,
      return_input: returnInput,
      rewrite_query: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || `Mixedbread rerank failed with status ${response.status}`);
  }

  const data = await response.json();
  return data?.data || [];
}
