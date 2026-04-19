export const API_KEY_FIELDS = [
  { id: "anthropic", label: "Anthropic API key", envKey: "ANTHROPIC_API_KEY", serviceKey: "anthropic" },
  { id: "tinyfish", label: "TinyFish API key", envKey: "TINYFISH_API_KEY", serviceKey: "tinyfish" },
  { id: "openai", label: "OpenAI API key", envKey: "OPENAI_API_KEY", serviceKey: "openai" },
  { id: "gemini", label: "Gemini API key", envKey: "GEMINI_API_KEY", serviceKey: "gemini" },
  { id: "heygen", label: "HeyGen API key", envKey: "HEYGEN_API_KEY", serviceKey: "heygen" },
  { id: "sendgrid", label: "SendGrid API key", envKey: "SENDGRID_API_KEY", serviceKey: "sendgrid" },
  { id: "agentmail", label: "AgentMail API key", envKey: "AGENTMAIL_API_KEY", serviceKey: "agentmail" },
  { id: "runway", label: "Runway API key", envKey: "RUNWAY_API_KEY", serviceKey: "runway" },
  { id: "stability", label: "Stability API key", envKey: "STABILITY_API_KEY", serviceKey: "stability" },
];

export function createEmptyApiKeys() {
  return Object.fromEntries(API_KEY_FIELDS.map((field) => [field.id, ""]));
}

export function normalizeApiKeys(input = {}) {
  return {
    ...createEmptyApiKeys(),
    ...input,
  };
}

export function hasApiKeys(apiKeys = {}) {
  return Object.values(apiKeys).some((value) => Boolean(String(value || "").trim()));
}

export function getStoredApiKeys() {
  if (typeof window === "undefined") return createEmptyApiKeys();

  try {
    const raw = window.localStorage.getItem("fr-api-keys");
    return normalizeApiKeys(raw ? JSON.parse(raw) : {});
  } catch {
    return createEmptyApiKeys();
  }
}

export function buildRuntimeKeyPayload(apiKeys = {}) {
  const normalized = normalizeApiKeys(apiKeys);
  return Object.fromEntries(
    API_KEY_FIELDS.map((field) => [field.envKey, String(normalized[field.id] || "").trim()]).filter(([, value]) => value)
  );
}

export function mergeStatusWithUserKeys(status, apiKeys = {}) {
  const runtimeKeys = buildRuntimeKeyPayload(apiKeys);
  const services = {
    ...status.services,
  };

  API_KEY_FIELDS.forEach((field) => {
    const backendConfigured = Boolean(status.services?.[field.serviceKey]?.configured);
    const personalConfigured = Boolean(runtimeKeys[field.envKey]);
    services[field.serviceKey] = {
      configured: backendConfigured || personalConfigured,
      source: personalConfigured ? "browser" : backendConfigured ? "backend" : "missing",
    };
  });

  const liveReady = Object.values(services).some((service) => service?.configured);

  return {
    ...status,
    workspaceMode: liveReady ? "hybrid" : "local",
    services,
  };
}

export function clearFounderReachSession() {
  if (typeof window === "undefined") return;

  Object.keys(window.localStorage)
    .filter((key) => key.startsWith("fr-"))
    .forEach((key) => window.localStorage.removeItem(key));
}
