async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Request failed");
  }

  return response.json();
}

export async function fetchStatus() {
  return request("/api/status", { method: "GET" });
}

export async function orchestrate(prompt, history = []) {
  return request("/api/orchestrate", {
    method: "POST",
    body: JSON.stringify({ prompt, history }),
  });
}

export async function sendEmail(contact) {
  return request("/api/actions/send-email", {
    method: "POST",
    body: JSON.stringify({ contact }),
  });
}

export async function bookMeeting(contact) {
  return request("/api/actions/book-meeting", {
    method: "POST",
    body: JSON.stringify({ contact }),
  });
}

export async function publishAsset(asset) {
  return request("/api/actions/publish", {
    method: "POST",
    body: JSON.stringify({ asset }),
  });
}

function parseSseChunk(chunk) {
  const event = { event: "message", data: null };
  const lines = chunk.split("\n");
  lines.forEach((line) => {
    if (line.startsWith("event:")) event.event = line.slice(6).trim();
    if (line.startsWith("data:")) {
      const raw = line.slice(5).trim();
      try {
        event.data = JSON.parse(raw);
      } catch {
        event.data = raw;
      }
    }
  });
  return event;
}

export async function streamAgentExecution({ agentId, planMessage, context, onEvent }) {
  const response = await fetch("/api/agents/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId, planMessage, context }),
  });

  if (!response.ok || !response.body) {
    throw new Error("Unable to start agent execution");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() || "";

    chunks
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .forEach((chunk) => onEvent(parseSseChunk(chunk)));
  }
}
