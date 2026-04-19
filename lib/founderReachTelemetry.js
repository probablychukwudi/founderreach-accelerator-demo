import { Axiom } from "@axiomhq/js";

let cachedKey = "";
let cachedClient = null;

function getAxiomClient(env = process.env) {
  const token = String(env.AXIOM_TOKEN || "").trim();
  if (!token) return null;
  if (cachedClient && cachedKey === token) return cachedClient;

  cachedKey = token;
  cachedClient = new Axiom({
    token,
    onError(error) {
      console.error("Axiom error", error instanceof Error ? error.message : String(error || "Unknown Axiom error"));
    },
  });

  return cachedClient;
}

export function hasAxiom(env = process.env) {
  return Boolean(String(env.AXIOM_TOKEN || "").trim() && String(env.AXIOM_DATASET || "").trim());
}

export async function ingestFounderReachEvent(eventType, fields = {}, env = process.env) {
  const dataset = String(env.AXIOM_DATASET || "").trim();
  const client = getAxiomClient(env);
  if (!dataset || !client) return false;

  try {
    await client.ingest(dataset, [
      {
        eventType,
        timestamp: new Date().toISOString(),
        ...fields,
      },
    ]);
    await client.flush();
    return true;
  } catch (error) {
    console.error("Axiom ingest failed", error instanceof Error ? error.message : String(error || "Unknown ingest error"));
    return false;
  }
}
