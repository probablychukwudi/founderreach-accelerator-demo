const AGENTMAIL_BASE_URL = "https://api.agentmail.to/v0";

export function hasAgentMail(env = process.env) {
  return Boolean(String(env.AGENTMAIL_API_KEY || "").trim() && String(env.AGENTMAIL_INBOX_ID || "").trim());
}

export async function sendAgentMailMessage(
  {
    to = [],
    subject = "",
    text = "",
    html = "",
    labels = [],
    replyTo = [],
  } = {},
  env = process.env
) {
  const apiKey = String(env.AGENTMAIL_API_KEY || "").trim();
  const inboxId = String(env.AGENTMAIL_INBOX_ID || "").trim();
  if (!apiKey || !inboxId) {
    throw new Error("AgentMail is not configured.");
  }

  const payload = {
    to: Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean),
    subject,
    text,
    html,
  };

  if (Array.isArray(labels) && labels.length) payload.labels = labels.filter(Boolean);
  if (Array.isArray(replyTo) && replyTo.length) payload.reply_to = replyTo.filter(Boolean);

  const response = await fetch(`${AGENTMAIL_BASE_URL}/inboxes/${encodeURIComponent(inboxId)}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || `AgentMail send failed with status ${response.status}`);
  }

  return response.json();
}
