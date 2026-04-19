import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

const GOOGLE_TOOLKITS = {
  gmail: "gmail",
  googleCalendar: "googlecalendar",
};

let cachedKey = "";
let cachedClient = null;

function getComposioClient(env = process.env) {
  const apiKey = String(env.COMPOSIO_API_KEY || "").trim();
  if (!apiKey) return null;
  if (cachedClient && cachedKey === apiKey) return cachedClient;

  cachedKey = apiKey;
  cachedClient = new Composio({
    apiKey,
    provider: new VercelProvider(),
  });
  return cachedClient;
}

async function getSession(sessionId = "guest-session", env = process.env) {
  const composio = getComposioClient(env);
  if (!composio) return null;
  return composio.create(sessionId);
}

function emptyConnectionState(slug) {
  return {
    slug,
    connected: false,
    connectedAccountId: "",
    status: "inactive",
  };
}

export function hasComposio(env = process.env) {
  return Boolean(String(env.COMPOSIO_API_KEY || "").trim());
}

export async function getGoogleConnectionState(sessionId = "guest-session", env = process.env) {
  const integrations = {
    gmail: emptyConnectionState(GOOGLE_TOOLKITS.gmail),
    googleCalendar: emptyConnectionState(GOOGLE_TOOLKITS.googleCalendar),
  };

  if (!hasComposio(env)) {
    return {
      ...integrations,
      available: false,
    };
  }

  try {
    const session = await getSession(sessionId, env);
    if (!session) {
      return {
        ...integrations,
        available: false,
      };
    }

    const response = await session.toolkits({
      toolkits: [GOOGLE_TOOLKITS.gmail, GOOGLE_TOOLKITS.googleCalendar],
      limit: 10,
    });

    (response?.items || []).forEach((item) => {
      const payload = {
        slug: item.slug,
        connected: Boolean(item.connection?.isActive),
        connectedAccountId: item.connection?.connectedAccount?.id || "",
        status: item.connection?.connectedAccount?.status || "inactive",
      };

      if (item.slug === GOOGLE_TOOLKITS.gmail) integrations.gmail = payload;
      if (item.slug === GOOGLE_TOOLKITS.googleCalendar) integrations.googleCalendar = payload;
    });

    return {
      ...integrations,
      available: true,
    };
  } catch (error) {
    return {
      ...integrations,
      available: true,
      error: error instanceof Error ? error.message : String(error || "Unable to inspect connections."),
    };
  }
}

export async function authorizeGoogleToolkit(toolkit, { sessionId = "guest-session", callbackUrl } = {}, env = process.env) {
  const session = await getSession(sessionId, env);
  if (!session) throw new Error("Composio is not configured.");

  const connection = await session.authorize(toolkit, callbackUrl ? { callbackUrl } : undefined);
  return {
    connectedAccountId: connection.id,
    redirectUrl: connection.redirectUrl || "",
    status: connection.status || "initiated",
  };
}

export async function createGmailDraft(sessionId, { recipientEmail, subject, body, isHtml = false } = {}, env = process.env) {
  const session = await getSession(sessionId, env);
  if (!session) throw new Error("Composio is not configured.");

  const result = await session.execute("GMAIL_CREATE_EMAIL_DRAFT", {
    recipient_email: recipientEmail,
    subject,
    body,
    is_html: isHtml,
  });

  if (result.error) throw new Error(result.error);
  return result.data || {};
}

export async function createCalendarEvent(
  sessionId,
  { summary, startDatetime, endDatetime, timezone = "UTC", attendees = [] } = {},
  env = process.env
) {
  const session = await getSession(sessionId, env);
  if (!session) throw new Error("Composio is not configured.");

  const result = await session.execute("GOOGLECALENDAR_CREATE_EVENT", {
    summary,
    start_datetime: startDatetime,
    end_datetime: endDatetime,
    timezone,
    attendees,
    create_meeting_room: true,
  });

  if (result.error) throw new Error(result.error);
  return result.data || {};
}
