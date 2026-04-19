import { AGENTS, AGENT_BY_ID, parseContext } from "../src/lib/founderReachCore.js";
import { hasAgentMail, sendAgentMailMessage } from "./founderReachAgentMail.js";
import {
  authorizeGoogleToolkit,
  createCalendarEvent,
  createGmailDraft,
  getGoogleConnectionState,
  hasComposio,
} from "./founderReachIntegrations.js";
import { hasMixedbread, rerankWithMixedbread } from "./founderReachMixedbread.js";
import { hasAxiom, ingestFounderReachEvent } from "./founderReachTelemetry.js";

const CLIENT_KEY_ALLOWLIST = [
  "ANTHROPIC_API_KEY",
  "TINYFISH_API_KEY",
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "HEYGEN_API_KEY",
  "SENDGRID_API_KEY",
  "AGENTMAIL_API_KEY",
  "RUNWAY_API_KEY",
  "STABILITY_API_KEY",
];
const MAX_CLIENT_CONFIG_HEADER_LENGTH = 20_000;

const ACTION_MODE_LABELS = {
  live: "Live",
  demo: "Demo-safe",
  "needs-account": "Needs account connection",
  "needs-keys": "Needs keys",
};

export function getServiceStatus(env = process.env) {
  return {
    anthropic: { configured: Boolean(env.ANTHROPIC_API_KEY) },
    tinyfish: { configured: Boolean(env.TINYFISH_API_KEY) },
    composio: { configured: Boolean(env.COMPOSIO_API_KEY) },
    axiom: { configured: hasAxiom(env) },
    mixedbread: { configured: hasMixedbread(env) },
    openai: { configured: Boolean(env.OPENAI_API_KEY) },
    gemini: { configured: Boolean(env.GEMINI_API_KEY) },
    heygen: { configured: Boolean(env.HEYGEN_API_KEY) },
    sendgrid: { configured: Boolean(env.SENDGRID_API_KEY) },
    agentmail: { configured: hasAgentMail(env) },
    runway: { configured: Boolean(env.RUNWAY_API_KEY) },
    stability: { configured: Boolean(env.STABILITY_API_KEY) },
  };
}

export async function getWorkspaceStatus(runtimeOrEnv = process.env) {
  const runtime = normalizeRuntime(runtimeOrEnv);
  const services = getServiceStatus(runtime.env);
  const integrations = await getGoogleConnectionState(runtime.sessionId, runtime.env);
  const liveReady = Object.values(services).some((entry) => entry?.configured);
  const actionModes = buildActionModes(runtime, integrations);

  return {
    workspaceMode: liveReady ? "hybrid" : "local",
    services,
    integrations: {
      gmail: integrations.gmail,
      googleCalendar: integrations.googleCalendar,
      providerAvailable: Boolean(integrations.available),
    },
    actions: {
      sendEmail: describeActionMode(actionModes.sendEmail),
      bookMeeting: describeActionMode(actionModes.bookMeeting),
      publish: describeActionMode(actionModes.publish),
      research: describeActionMode(actionModes.research),
    },
  };
}

export async function buildPlan(prompt = "", history = [], env = process.env) {
  if (env.FOUNDERREACH_FORCE_DEMO) return buildFallbackPlan(prompt, env);
  if (!env.ANTHROPIC_API_KEY) return buildFallbackPlan(prompt, env);
  try {
    return await orchestrateWithAnthropic(prompt, history, env);
  } catch {
    // Any unexpected orchestration failure (network, JSON shape, timeout)
    // should degrade cleanly to the local heuristic plan rather than 500.
    return buildFallbackPlan(prompt, env);
  }
}

export async function executeAgentRun(agentId, context = {}, send = () => {}, env = process.env) {
  const agent = AGENT_BY_ID[agentId];
  if (!agent) throw new Error("Unknown agent");

  send("started", { text: `${agent.name} started` });
  return executeAgent(agent, context, send, env);
}

export async function sendEmailAction(contact, runtimeOrEnv = process.env) {
  const runtime = normalizeRuntime(runtimeOrEnv);
  const contactName = contact?.name || "contact";
  const contactCompany = contact?.company || "your company";
  const contactRole = contact?.role || "their role";
  const contactEmail = contact?.email || "";
  const sentAt = new Date().toISOString();

  const subject = `FounderReach x ${contactCompany}`;
  const body = [
    `Hi ${contactName.split(" ")[0]},`,
    "",
    `I wanted to reach out directly as ${contactRole} at ${contactCompany}. FounderReach is an agent orchestration layer that compresses research, outreach, content, and publishing into one founder workflow.`,
    "",
    "Would you be open to a short 15-minute walkthrough this week? Happy to send a brief first so it is a high-signal use of your time.",
    "",
    "Chukwudi",
    "OWO Innovations / FounderReach",
  ].join("\n");

  const email = {
    to: contactEmail || `${contactName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    toName: contactName,
    toCompany: contactCompany,
    subject,
    body,
    sentAt,
    status: "drafted",
  };

  const emailDomain = getEmailDomain(email.to);
  const baseTelemetry = {
    sessionId: runtime.sessionId,
    mode: runtime.demoMode ? "demo" : "runtime",
    company: contactCompany,
    contactRole,
    hasEmail: Boolean(contactEmail),
    emailDomain,
  };

  if (runtime.demoMode) {
    await ingestFounderReachEvent("founderreach.action.send_email", { ...baseTelemetry, outcome: "demo", provider: "workspace" }, runtime.env);
    return {
      ok: true,
      mode: "demo",
      message: `Demo-safe email draft created for ${contactName}. FounderReach stored it in the workspace outbox only.`,
      email,
    };
  }

  const integrations = hasComposio(runtime.env)
    ? await getGoogleConnectionState(runtime.sessionId, runtime.env)
    : { gmail: { connected: false } };

  try {
    if (integrations.gmail?.connected) {
      const liveDraft = await createGmailDraft(
        runtime.sessionId,
        {
          recipientEmail: email.to,
          subject: email.subject,
          body: email.body,
        },
        runtime.env
      );

      await ingestFounderReachEvent("founderreach.action.send_email", { ...baseTelemetry, outcome: "live", provider: "gmail" }, runtime.env);
      return {
        ok: true,
        mode: "live",
        message: `Gmail draft created for ${contactName}. FounderReach also saved the draft in your workspace.`,
        email: {
          ...email,
          status: "drafted-live",
          provider: "gmail",
          providerDraft: liveDraft,
        },
      };
    }

    if (hasAgentMail(runtime.env)) {
      const liveMessage = await sendAgentMailMessage(
        {
          to: [email.to],
          subject: email.subject,
          text: email.body,
          html: buildEmailHtml(email.body),
          labels: ["founderreach", "outreach"],
        },
        runtime.env
      );

      await ingestFounderReachEvent("founderreach.action.send_email", { ...baseTelemetry, outcome: "live", provider: "agentmail" }, runtime.env);
      return {
        ok: true,
        mode: "live",
        message: `FounderReach sent a live email to ${contactName} from your AgentMail inbox and saved it in the workspace.`,
        email: {
          ...email,
          status: "sent-live",
          provider: "agentmail",
          providerMessage: liveMessage,
        },
      };
    }
  } catch {
    await ingestFounderReachEvent("founderreach.action.send_email", { ...baseTelemetry, outcome: "fallback-demo", provider: "workspace" }, runtime.env);
    return {
      ok: true,
      mode: "demo",
      message: `Live email delivery failed, so FounderReach kept a safe local draft for ${contactName}.`,
      email,
    };
  }

  const fallbackMode = hasComposio(runtime.env) ? "needs-account" : "needs-keys";
  await ingestFounderReachEvent(
    "founderreach.action.send_email",
    { ...baseTelemetry, outcome: fallbackMode, provider: "workspace" },
    runtime.env
  );
  return {
    ok: true,
    mode: fallbackMode,
    message: fallbackMode === "needs-account"
      ? `Connect Gmail to create a personal draft, or keep AgentMail configured to send from FounderReach. FounderReach saved a workspace draft for ${contactName} in the meantime.`
      : `Live email sending is not configured on the backend yet. FounderReach saved a workspace draft for ${contactName}.`,
    email,
  };
}

export async function bookMeetingAction(contact, runtimeOrEnv = process.env) {
  const runtime = normalizeRuntime(runtimeOrEnv);
  const contactName = contact?.name || "contact";
  const contactCompany = contact?.company || "their team";
  const contactEmail = contact?.email || "";
  const meeting = buildMeetingEnvelope(contactName, contactCompany, runtime.timezone);
  const emailDomain = getEmailDomain(contactEmail);
  const baseTelemetry = {
    sessionId: runtime.sessionId,
    mode: runtime.demoMode ? "demo" : "runtime",
    company: contactCompany,
    hasEmail: Boolean(contactEmail),
    emailDomain,
  };

  if (runtime.demoMode) {
    await ingestFounderReachEvent("founderreach.action.book_meeting", { ...baseTelemetry, outcome: "demo", provider: "workspace" }, runtime.env);
    return {
      ok: true,
      mode: "demo",
      message: `Demo-safe meeting hold created for ${contactName}. FounderReach added it to the workspace calendar only.`,
      meeting,
    };
  }

  if (!hasComposio(runtime.env)) {
    await ingestFounderReachEvent("founderreach.action.book_meeting", { ...baseTelemetry, outcome: "needs-keys", provider: "workspace" }, runtime.env);
    return {
      ok: true,
      mode: "needs-keys",
      message: `Google Calendar is not configured on the backend yet. FounderReach added a workspace hold for ${contactName}.`,
      meeting,
    };
  }

  const integrations = await getGoogleConnectionState(runtime.sessionId, runtime.env);
  if (!integrations.googleCalendar.connected) {
    await ingestFounderReachEvent("founderreach.action.book_meeting", { ...baseTelemetry, outcome: "needs-account", provider: "workspace" }, runtime.env);
    return {
      ok: true,
      mode: "needs-account",
      message: `Connect Google Calendar to create a real event. FounderReach added a workspace hold for ${contactName}.`,
      meeting,
    };
  }

  try {
    const liveEvent = await createCalendarEvent(
      runtime.sessionId,
      {
        summary: meeting.title,
        startDatetime: meeting.startsAt,
        endDatetime: meeting.endsAt,
        timezone: runtime.timezone,
        attendees: contactEmail ? [{ email: contactEmail }] : [],
      },
      runtime.env
    );

    await ingestFounderReachEvent("founderreach.action.book_meeting", { ...baseTelemetry, outcome: "live", provider: "googlecalendar" }, runtime.env);
    return {
      ok: true,
      mode: "live",
      message: `Google Calendar event created for ${contactName}. FounderReach also mirrored it in the workspace calendar.`,
      meeting: {
        ...meeting,
        status: "scheduled-live",
        provider: "googlecalendar",
        providerEvent: liveEvent,
      },
    };
  } catch {
    await ingestFounderReachEvent("founderreach.action.book_meeting", { ...baseTelemetry, outcome: "fallback-demo", provider: "workspace" }, runtime.env);
    return {
      ok: true,
      mode: "demo",
      message: `Live calendar creation failed, so FounderReach kept a safe workspace hold for ${contactName}.`,
      meeting,
    };
  }
}

export async function publishAction(asset, runtimeOrEnv = process.env) {
  const runtime = normalizeRuntime(runtimeOrEnv);
  const assetName = asset?.name || "asset";
  const assetType = asset?.type || "asset";
  const publishedAt = new Date().toISOString();

  const channelsByType = {
    Tweet: [
      { platform: "X", status: "scheduled", url: "https://x.com/compose/tweet" },
      { platform: "LinkedIn", status: "queued", url: "https://linkedin.com" },
    ],
    Newsletter: [{ platform: "Substack", status: "scheduled", url: "https://substack.com" }],
    "Video Script": [{ platform: "YouTube", status: "staged", url: "https://studio.youtube.com" }],
    Email: [{ platform: "Outbox", status: "drafted", url: "" }],
    Image: [
      { platform: "X", status: "scheduled", url: "https://x.com" },
      { platform: "LinkedIn", status: "queued", url: "https://linkedin.com" },
    ],
    Podcast: [{ platform: "Spotify", status: "staged", url: "https://podcasters.spotify.com" }],
    Course: [{ platform: "Gumroad", status: "staged", url: "https://gumroad.com" }],
  };
  const publishedTo = channelsByType[assetType] || [{ platform: "Web", status: "staged", url: "" }];

  await ingestFounderReachEvent(
    "founderreach.action.publish",
    {
      sessionId: runtime.sessionId,
      mode: runtime.demoMode ? "demo" : "runtime",
      outcome: "demo",
      assetType,
      platforms: publishedTo.map((entry) => entry.platform).join(","),
    },
    runtime.env
  );

  return {
    ok: true,
    mode: "demo",
    message: `"${assetName}" was staged for ${publishedTo.map((entry) => entry.platform).join(" + ")}. Publishing remains demo-safe until social automations are wired.`,
    publish: {
      assetId: asset?.id || null,
      assetName,
      assetType,
      publishedAt,
      publishedTo,
    },
  };
}

export async function createIntegrationLink(toolkit, runtimeOrEnv = process.env) {
  const runtime = normalizeRuntime(runtimeOrEnv);
  if (!hasComposio(runtime.env)) throw new Error("Composio is not configured on this deployment.");

  const supported = new Set(["gmail", "googlecalendar"]);
  if (!supported.has(toolkit)) throw new Error("Unsupported integration toolkit.");

  const callbackBase = runtime.origin || "http://localhost:3000";
  const callbackUrl = `${callbackBase}/app?settings=1&integration=${encodeURIComponent(toolkit)}`;
  const result = await authorizeGoogleToolkit(
    toolkit,
    {
      sessionId: runtime.sessionId,
      callbackUrl,
    },
    runtime.env
  );

  await ingestFounderReachEvent(
    "founderreach.integration.connect",
    {
      sessionId: runtime.sessionId,
      toolkit,
      outcome: result.status || "initiated",
      origin: runtime.origin || "",
    },
    runtime.env
  );

  return result;
}

export async function submitLeadCapture(payload, runtimeOrEnv = process.env) {
  const runtime = normalizeRuntime(runtimeOrEnv);
  const lead = sanitizeLeadPayload(payload);

  if (!lead.name || !lead.email || !lead.useCase) {
    throw new Error("Name, email, and use case are required.");
  }

  const leadId = `lead-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const enrichedLead = {
    ...lead,
    id: leadId,
    receivedAt: new Date().toISOString(),
  };

  const sentViaWebhook = await maybeForwardLeadToWebhook(enrichedLead, runtime.env);
  const sentViaAgentMail = sentViaWebhook ? false : await maybeSendLeadViaAgentMail(enrichedLead, runtime.env);
  const sentViaEmail = sentViaWebhook || sentViaAgentMail ? false : await maybeSendLeadEmail(enrichedLead, runtime.env);
  const deliveryMode = sentViaWebhook ? "webhook" : sentViaAgentMail ? "agentmail" : sentViaEmail ? "email" : "logged";
  const emailDomain = getEmailDomain(enrichedLead.email);

  console.info(JSON.stringify({ type: "founderreach.lead", leadId, source: enrichedLead.source, deliveryMode }));
  await ingestFounderReachEvent(
    "founderreach.lead",
    {
      leadId,
      source: enrichedLead.source,
      intent: enrichedLead.intent,
      deliveryMode,
      emailDomain,
      hasCompany: Boolean(enrichedLead.company),
      hasWebsite: Boolean(enrichedLead.website),
      hasPreferredTime: Boolean(enrichedLead.preferredTime),
      role: enrichedLead.role || "",
    },
    runtime.env
  );

  return {
    ok: true,
    leadId,
    mode: sentViaWebhook || sentViaAgentMail || sentViaEmail ? "live" : "demo",
    message: sentViaWebhook || sentViaAgentMail || sentViaEmail
      ? "Demo request received. FounderReach routed it to your live intake."
      : "Demo request captured. FounderReach logged it safely on this deployment.",
  };
}

async function orchestrateWithAnthropic(prompt, history, env) {
  const system = `You are FounderReach. Return only valid JSON in the shape {"agents":[{"agent":"orchestrator","message":"...","api":"search"}]}. Route the right 3-8 agents for the user request.`;
  const messages = [
    ...history.map((entry) => ({
      role: entry.role === "assistant" ? "assistant" : "user",
      content: entry.content,
    })),
    { role: "user", content: prompt },
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1200,
      system,
      messages,
    }),
  });

  if (!response.ok) return buildFallbackPlan(prompt, env);

  const data = await response.json();
  const text = data.content?.find((block) => block.type === "text")?.text || "";
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return {
      context: parseContext(prompt),
      agents: (parsed.agents || []).map((entry) => ({
        ...entry,
        api: entry.api || AGENT_BY_ID[entry.agent]?.api || "search",
      })),
    };
  } catch {
    return buildFallbackPlan(prompt, env);
  }
}

function buildLocalPlan(prompt) {
  const context = parseContext(prompt);
  const orderedAgents = context.agents
    .sort((left, right) => AGENT_BY_ID[left].tier - AGENT_BY_ID[right].tier)
    .slice(0, context.agents.length > 10 ? 10 : context.agents.length);

  return {
    context,
    agents: orderedAgents.map((agentId) => ({
      agent: agentId,
      api: AGENT_BY_ID[agentId].api,
      message: buildAgentMessage(agentId, context),
    })),
  };
}

async function buildFallbackPlan(prompt, env = process.env) {
  const heuristicPlan = buildLocalPlan(prompt);
  if (!hasMixedbread(env)) return heuristicPlan;

  try {
    const maxAgents = Math.min(8, Math.max(heuristicPlan.agents.length, 4));
    const ranked = await rerankWithMixedbread(
      prompt,
      AGENTS.map((agent) => `${agent.name}. ${agent.role}. API: ${agent.api}. ${buildAgentMessage(agent.id, heuristicPlan.context)}`),
      { topK: maxAgents, returnInput: false },
      env
    );

    const orderedIds = [
      ...ranked.map((entry) => AGENTS[entry.index]?.id).filter(Boolean),
      ...heuristicPlan.agents.map((entry) => entry.agent),
    ].filter(uniqueValues);

    return {
      context: heuristicPlan.context,
      agents: orderedIds.slice(0, maxAgents).map((agentId) => ({
        agent: agentId,
        api: AGENT_BY_ID[agentId].api,
        message: buildAgentMessage(agentId, heuristicPlan.context),
      })),
    };
  } catch {
    return heuristicPlan;
  }
}

function buildAgentMessage(agentId, context) {
  const topic = context.topic || context.idea;
  const industry = context.industry || "your market";
  const messages = {
    orchestrator: `I am breaking this request into the highest-leverage moves across fundraising, content, execution, and operations for ${topic}.`,
    guardrail: "I am checking the plan for risky claims, weak outreach language, and obvious compliance gaps before anything ships.",
    pm: `I am framing the product surface, user value, and rollout sequencing for FounderReach in ${industry}.`,
    cmo: "I am sharpening the market angle, launch narrative, and growth hooks so the product reads clearly to users and judges.",
    vc: `I am identifying the most relevant early-stage investors for ${topic} and how to position the company to them.`,
    sales: "I am mapping likely buyers, warm entry points, and outreach angles for a focused pipeline.",
    research: "I am finding partners, grant paths, and evidence sources that strengthen the story.",
    content_dir: "I am building the content system and pillar map so every output reinforces the brand.",
    seo: "I am surfacing discovery opportunities, keywords, and titles that can compound distribution.",
    analytics: "I am defining benchmarks and what success should look like as this grows.",
    monetization: "I am identifying sponsor, product, and revenue pathways that fit the audience.",
    designer: "I am translating the product into a premium creative direction with brand and UI clarity.",
    tweets: "I am turning the strongest insight into a launch-ready social thread.",
    newsletter: "I am drafting an email issue that explains the product with authority and momentum.",
    video_prod: "I am structuring a demo script that makes the product legible in the first minute.",
    podcast: "I am shaping an audio angle that extends the story into longer-form thought leadership.",
    course_builder: "I am outlining how this could expand into a teachable system or productized education asset.",
    webbuilder: "I am mapping the web and stack decisions needed to make this demo feel deployment-ready.",
    imagegen: "I am generating a branded visual concept that fits the FounderReach interface and story.",
    videogen: "I am preparing a short AI video asset so the product feels pitch-ready.",
    outreach: "I am drafting personalized outbound copy for the highest-value targets.",
    publisher: "I am building the platform-by-platform publishing motion for this launch.",
    scheduler: "I am turning this into a clear weekly execution cadence.",
    archivist: "I am organizing outputs so the workspace compounds instead of getting noisy.",
  };
  return messages[agentId] || `I am working on ${topic}.`;
}

async function executeAgent(agent, context, send, env) {
  if (env.FOUNDERREACH_FORCE_DEMO) {
    return simulateAgent(agent, context, send);
  }

  const liveTinyFish = Boolean(env.TINYFISH_API_KEY);
  const liveOpenAI = Boolean(env.OPENAI_API_KEY);
  const liveHeygen = Boolean(env.HEYGEN_API_KEY);

  if (agent.api === "image" && liveOpenAI) {
    send("progress", { text: "Generating image with OpenAI" });
    const prompt = `${context.topic || context.idea}. Premium founder dashboard concept, editorial product shot, clean composition.`;
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
      }),
    });
    if (!response.ok) throw new Error(`OpenAI image request failed with status ${response.status}`);
    const data = await response.json();
    return {
      result: { prompt, imageUrl: data.data?.[0]?.url || "" },
      imageUrl: data.data?.[0]?.url || "",
      summary: "Image delivered",
    };
  }

  if (agent.api === "video" && liveHeygen) {
    send("progress", { text: "Requesting HeyGen render" });
    const script = `${context.topic || context.idea}. FounderReach demo overview in 45 seconds.`;
    const create = await fetch("https://api.heygen.com/v2/video/generate", {
      method: "POST",
      headers: {
        "X-Api-Key": env.HEYGEN_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: { type: "avatar", avatar_id: "Daisy-inskirt-20220818", avatar_style: "normal" },
            voice: { type: "text", input_text: script, voice_id: "2d5b0e6cf36f460aa7fc47e3eee4ba54" },
          },
        ],
        dimension: { width: 1280, height: 720 },
      }),
    });
    if (!create.ok) throw new Error(`HeyGen request failed with status ${create.status}`);
    const createData = await create.json();
    const videoId = createData.data?.video_id;
    let videoUrl = "";
    for (let attempt = 0; attempt < 6; attempt += 1) {
      send("progress", { text: `Waiting for HeyGen render${attempt ? ` (${attempt + 1})` : ""}` });
      await sleep(3500);
      const statusResponse = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
        headers: { "X-Api-Key": env.HEYGEN_API_KEY },
      });
      const statusData = await statusResponse.json();
      if (statusData.data?.status === "completed") {
        videoUrl = statusData.data?.video_url || "";
        break;
      }
    }
    return {
      result: { videoId, videoUrl, script },
      videoUrl,
      summary: videoUrl ? "Video delivered" : "Video request queued",
    };
  }

  if (liveTinyFish && agent.api === "search") {
    send("progress", { text: "Running TinyFish Search" });
    const query = `${context.topic || context.idea} ${context.industry}`.trim();
    const response = await fetch(`https://api.search.tinyfish.ai?q=${encodeURIComponent(query)}&limit=6`, {
      headers: { "X-API-Key": env.TINYFISH_API_KEY },
    });
    if (response.ok) {
      const data = await response.json();
      return {
        result: data,
        summary: "TinyFish Search complete",
      };
    }
  }

  if (liveTinyFish && agent.api === "agent") {
    send("progress", { text: "Starting TinyFish browser automation" });
    return proxyTinyFishAgent(agent, context, send, env);
  }

  return simulateAgent(agent, context, send);
}

async function proxyTinyFishAgent(agent, context, send, env) {
  const targetUrl = buildLiveTargetUrl(agent.id);
  const goal = buildGoal(agent.id, context);
  const response = await fetch("https://agent.tinyfish.ai/v1/automation/run-sse", {
    method: "POST",
    headers: {
      "X-API-Key": env.TINYFISH_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: targetUrl,
      goal,
      browser_profile: "stealth",
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`TinyFish agent failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult = null;
  let streamUrl = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    lines.forEach((line) => {
      if (!line.startsWith("data: ")) return;
      try {
        const event = JSON.parse(line.slice(6));
        if (event.type === "STARTED") {
          streamUrl = event.streaming_url || "";
          send("progress", { text: "Live browser attached" });
        }
        if (event.type === "PROGRESS") {
          send("progress", { text: event.purpose || "Working..." });
        }
        if (event.type === "COMPLETE" || event.type === "COMPLETED") {
          finalResult = event.result;
        }
      } catch {
        // Ignore malformed lines from upstream.
      }
    });
  }

  return {
    result: finalResult || buildMockResult(agent.id, context),
    streamUrl,
    summary: streamUrl ? "TinyFish agent complete" : "Agent complete",
  };
}

function buildLiveTargetUrl(agentId) {
  if (agentId === "vc") return "https://www.crunchbase.com/discover/organization.investors";
  if (agentId === "sales") return "https://www.linkedin.com/search/results/companies/";
  if (agentId === "outreach") return "https://mail.google.com";
  if (agentId === "publisher") return "https://x.com";
  if (agentId === "scheduler") return "https://calendar.google.com";
  return "https://news.ycombinator.com";
}

function buildGoal(agentId, context) {
  const topic = context.topic || context.idea;
  const industry = context.industry || "founder tools";
  const goals = {
    vc: `Find strong pre-seed and seed investors for ${topic} in ${industry}. Extract fund name, thesis, example portfolio fit, and return structured JSON only.`,
    sales: `Find likely customers or design partners for ${topic} in ${industry}. Return company, buyer title, why they fit, and an opener in structured JSON only.`,
    outreach: `Draft high-context outreach for the strongest investors and partners found for ${topic}. Return concise JSON only.`,
    publisher: `Create a publish-ready rollout sequence for ${topic} across X, LinkedIn, and newsletter. Return structured JSON only.`,
    scheduler: `Create a founder-friendly weekly calendar for launching ${topic}. Return structured JSON only.`,
  };
  return goals[agentId] || `Research ${topic} in ${industry} and return structured JSON only.`;
}

async function simulateAgent(agent, context, send) {
  const steps = buildMockSteps(agent.id);
  for (const step of steps) {
    send("progress", { text: step });
    await sleep(900);
  }
  const result = buildMockResult(agent.id, context);
  return {
    result,
    streamUrl: agent.api === "agent" ? "https://news.ycombinator.com" : "",
    imageUrl: result.imageUrl || "",
    videoUrl: result.videoUrl || "",
    summary: "Demo result ready",
  };
}

function buildMockSteps(agentId) {
  const steps = {
    orchestrator: ["Mapping the request", "Selecting the highest-leverage specialists", "Handing off execution"],
    vc: ["Scanning investor patterns", "Scoring fit by thesis", "Packaging outreach-ready notes"],
    sales: ["Identifying likely buyers", "Comparing signals and urgency", "Generating pipeline notes"],
    research: ["Collecting labs and grant signals", "Pulling evidence into a brief", "Formatting research outputs"],
    content_dir: ["Mapping pain points", "Building content pillars", "Assembling the channel plan"],
    tweets: ["Finding the strongest hook", "Writing a thread arc", "Tightening each post"],
    newsletter: ["Drafting subject and preview", "Structuring sections", "Finishing CTA"],
    video_prod: ["Outlining hook and flow", "Writing the demo story", "Packaging segments"],
    imagegen: ["Generating art direction", "Rendering visual concept", "Saving the asset"],
    videogen: ["Writing the avatar script", "Preparing render request", "Finalizing video deliverable"],
    scheduler: ["Mapping weekly cadence", "Sequencing creation blocks", "Adding publish windows"],
    designer: ["Exploring visual direction", "Locking palette and tone", "Returning the design brief"],
  };
  return steps[agentId] || ["Gathering context", "Working through the task", "Formatting the result"];
}

function buildMockResult(agentId, context) {
  const topic = context.topic || context.idea || "FounderReach";
  const industry = context.industry || "founder tooling";
  switch (agentId) {
    case "vc":
      return {
        investors: [
          { name: "Tiny Capital Partners", thesis: `Invests in early operator tools and founder productivity systems in ${industry}.`, check_size: "$250k-$1M", portfolio_ex: "Ramp", url: "https://example.com/tiny-capital", match: "high", email: "team@tinycapital.example" },
          { name: "Operator Seed", thesis: "Backs distribution-heavy B2B and solo-founder leverage platforms.", check_size: "$500k", portfolio_ex: "Notion", url: "https://example.com/operator-seed", match: "medium", email: "partners@operatorseed.example" },
          { name: "Northbound Ventures", thesis: "Looks for systems-of-work startups with strong workflow lock-in.", check_size: "$750k", portfolio_ex: "Linear", url: "https://example.com/northbound", match: "high", email: "hello@northbound.example" },
        ],
        total: 3,
        top_match: "Tiny Capital Partners",
      };
    case "sales":
      return {
        prospects: [
          { company: "Launch Ledger", size: "11-50", website: "launchledger.example", title: "Head of Growth", reason: `Needs unified founder execution for ${topic}.`, opener: "Your team already publishes founder-led content; FounderReach could compress the execution stack.", email: "growth@launchledger.example" },
          { company: "Creator Ops Co", size: "11-50", website: "creatorops.example", title: "Founder", reason: "Strong fit as a creator-business operating layer.", opener: "You are already selling workflow leverage. This would tighten the end-to-end loop.", email: "founder@creatorops.example" },
        ],
        icp: "Best-fit users are founder-led businesses and creator operators who need one workspace for outreach, content, and scheduling.",
      };
    case "research":
      return {
        labs: [
          { lab: "Applied Creativity Lab", institution: "Northwestern", researcher: "Dr. Amina Patel", email: "apatel@northwestern.example", focus: "AI-mediated productivity systems", relevance: "High" },
          { lab: "Founder Systems Group", institution: "UT Austin", researcher: "Dr. Leo Morris", email: "lmorris@utexas.example", focus: "Human-in-the-loop workflows", relevance: "Medium" },
        ],
        grants: [{ program: "SBIR Phase I", award: "$275,000", deadline: "Rolling", url: "https://seedfund.nsf.gov" }, { program: "Open Innovation Grant", award: "$150,000", deadline: "June 30", url: "https://example.com/grants" }],
      };
    case "content_dir":
      return {
        pain_points: [{ pain: "Too many disconnected tools", evidence: "Founders juggle 5-10 apps to keep momentum.", copy_angle: "One operating system instead of a fragmented stack." }, { pain: "Content creation breaks when sales gets busy", evidence: "Founders lose consistency under execution load.", copy_angle: "Same workspace powers both demand and distribution." }],
        content_pillars: ["Founder leverage", "AI operating systems", "Building in public", "Creator monetization", "Workflow design"],
        best_formats: ["Threads", "Weekly deep-dive emails", "Short demo videos"],
        posting_frequency: "4-5 meaningful posts per week",
        top_channels: ["X", "LinkedIn", "YouTube"],
      };
    case "seo":
      return {
        keywords: [{ keyword: "founder operating system", difficulty: "medium", search_intent: "commercial" }, { keyword: "creator workflow automation", difficulty: "low", search_intent: "commercial" }, { keyword: "AI founder tools", difficulty: "medium", search_intent: "informational" }],
        competitor_pages: [{ title: "Top founder tools", url: "https://example.com/founder-tools", angle: "Listicle" }, { title: "How creators automate content", url: "https://example.com/creator-automation", angle: "Educational" }],
        content_gap: "Most content separates founder workflows from creator systems. FounderReach can own the overlap.",
        recommended_title: "The Founder Operating System: How Solo Teams Scale Like Companies",
      };
    case "analytics":
      return { benchmarks: { avg_views_per_video: 4200, top_channels: [{ name: "Modern Founder", subs: 81000, avg_views: 6200, cadence: "2 videos/week" }, { name: "Creator Systems", subs: 28000, avg_views: 4300, cadence: "1 video/week" }] }, engagement_rates: { youtube: 4.2, twitter: 2.8, linkedin: 3.6 }, growth_strategies: ["Narrative demos", "Founder POV content", "Multi-format reuse"] };
    case "monetization":
      return { sponsors: [{ brand: "Workspace Cloud", contact: "partnerships@workspacecloud.example", avg_deal: "$3k-$8k", pitch_angle: "Founder efficiency audience" }, { brand: "Launch CRM", contact: "sponsors@launchcrm.example", avg_deal: "$2k-$5k", pitch_angle: "Go-to-market operator audience" }], product_ideas: [{ product: "FounderReach playbook", price_point: 99, audience: "Solo founders", effort: "low" }, { product: "Creator GTM course", price_point: 249, audience: "Creator businesses", effort: "medium" }], course_opportunity: { title: "Build Your Founder OS", price: 299, target_students: 250, unique_angle: "Combines creator workflows with startup execution" } };
    case "designer":
      return { palette: { primary: "#2563FF", secondary: "#181C23", accent: "#F1F4FA", rationale: "Signals precision, clarity, and operator-grade confidence." }, typography: { heading: "Inter", body: "Inter", rationale: "Operational clarity without noise." }, ui_direction: "Bright neutral workspace with blue accents and editorial spacing.", logo_concept: "Minimal modular mark anchored in a geometric founder signal system.", landing_page_structure: ["Hero", "24-agent system explainer", "Live automation proof", "CRM/Vault/Calendar demo", "Integration CTA"] };
    case "tweets":
      return { thread: [{ n: 1, text: "Founders do not need more dashboards. They need one system that turns an idea into outreach, content, and momentum.", chars: 124 }, { n: 2, text: "FounderReach treats a solo founder like a full company. 24 specialists, one workspace, shared memory, real execution.", chars: 119 }, { n: 3, text: "The interesting part is not the AI. It is the routing. The right agent handles the right job at the right time.", chars: 117 }, { n: 4, text: "That means fundraising, content, research, CRM, and scheduling stop fighting for attention.", chars: 99 }, { n: 5, text: "If you are building in public, you are already a founder and a media company. Your software should act like it.", chars: 118 }], hook_style: "Contrarian systems hook", best_post_time: "Tuesday 9:00 AM CT" };
    case "newsletter":
      return { subject: "The operating system behind founder-led momentum", preview: "How a solo founder can work like a team.", intro: `This issue breaks down how ${topic} turns fragmented startup work into one shared operating system.`, sections: [{ title: "The real bottleneck", body: "Most teams lose speed in the handoff between research, writing, and execution.", takeaway: "Speed is a coordination problem." }, { title: "Why agents work", body: "Specialists create sharper outputs than one generalist tab-hopping all day.", takeaway: "Structure creates leverage." }], cta: "Reply if you want the live review build checklist.", estimated_read_time: "4 min", tone_notes: "Operator-grade and clear" };
    case "video_prod":
      return { title: "FounderReach Demo Overview", hook: "What if one founder could operate like a full-stack team without adding more tabs?", segments: [{ type: "intro", script: "Set up the pain of fragmented startup execution.", broll_note: "Closeups of disconnected tools", duration_sec: 35 }, { type: "main", script: "Show the shell, runs list, run context, CRM, vault, and calendar working together.", broll_note: "Screen recordings", duration_sec: 140 }, { type: "cta", script: "Invite accelerator judges to imagine this with live keys connected.", broll_note: "Product hero shot", duration_sec: 25 }], thumbnail_concept: "Bright operator workspace with crisp blue status accents", tags: ["founder tools", "AI agents", "startup systems"], estimated_length_min: 4 };
    case "podcast":
      return { episode_title: "Why founders need an operating system, not another app", description: "A deep dive into creator-style distribution for startup founders.", format: "solo", segments: [{ name: "Opening thesis", duration_min: 6, notes: "Frame the overlap between startup ops and creator workflows." }, { name: "System design", duration_min: 14, notes: "Break down agents, routing, and compounding outputs." }], guest_ideas: [{ name: "A founder-creator operator", why: "Crosses both worlds", how_to_reach: "Warm intro via X or LinkedIn" }], show_notes_template: "Intro, main insights, quotes, CTA", chapter_markers: ["Why tools fragment", "What agents fix", "How to launch it"] };
    case "course_builder":
      return { course_title: "Build Your Founder Operating System", tagline: "Design the workflows that let one person move like a team.", price_point: 249, modules: [{ module_num: 1, title: "Operating system design", lessons: [{ title: "Map your workflow", type: "video", duration_min: 18 }] }, { module_num: 2, title: "Founder content engine", lessons: [{ title: "Turn one idea into five formats", type: "video", duration_min: 21 }] }], prerequisites: ["Basic startup context"], learning_outcomes: ["Design agent workflows", "Build founder-led content loops"], launch_strategy: "Bundle with a founder operating system template and live workshop." };
    case "webbuilder":
      return { stack: { frontend: "React + Vite", backend: "Node + Express", database: "Supabase later", auth: "Supabase later", hosting: "Vercel or Render", rationale: "Fastest path to a polished, reviewable build." }, templates: [{ name: "Dashboard shell", url: "https://example.com/dashboard-template", features: ["Side rail", "Responsive shell", "Top bar"] }, { name: "Landing page starter", url: "https://example.com/landing-template", features: ["Hero", "Feature grid", "CTA"] }], estimated_monthly_cost: 35, build_time_estimate: "1-2 focused days for a polished MVP shell" };
    case "outreach":
      return { emails: [{ to_name: "Tiny Capital Partners", to_role: "Partner", to_org: "Tiny Capital Partners", subject: "FounderReach for operator-led founders", body: "Your investment focus on operator tools stood out. FounderReach compresses research, outreach, and publishing into one founder workflow. I would love to show you the system in a 15-minute demo.", opener_source: "Operator tools thesis", priority: "high" }] };
    case "publisher":
      return { platforms: [{ name: "X", optimal_time: "9:00 AM CT", format: "5-post thread", repurpose_from: "Demo script", checklist: ["Lead with a contrarian hook", "Attach product visual", "Reply with CTA"] }, { name: "LinkedIn", optimal_time: "11:00 AM CT", format: "Story post", repurpose_from: "Newsletter", checklist: ["Use founder narrative", "Include product screenshot"] }], scheduling_order: ["X", "LinkedIn", "Newsletter"], automation_tools: ["TinyFish Agent for browser execution"] };
    case "scheduler":
      return { weekly_schedule: [{ day: "Monday", tasks: ["Research and investor scan"], batch_type: "research" }, { day: "Tuesday", tasks: ["Thread writing and newsletter draft"], batch_type: "creation" }, { day: "Wednesday", tasks: ["Video script and brand polish"], batch_type: "creation" }, { day: "Thursday", tasks: ["Outreach and follow-up"], batch_type: "publishing" }, { day: "Friday", tasks: ["Weekly review and repurposing"], batch_type: "admin" }], monthly_view: { week1: "Narrative foundation", week2: "Content sprint", week3: "Distribution push", week4: "Review and refine" }, batch_day_template: { morning: "Research", afternoon: "Creation", evening: "Publishing" }, automation_windows: ["Tuesday 9 AM", "Thursday 11 AM"] };
    case "archivist":
      return { vault_structure: [{ section: "Ideas Inbox", purpose: "Capture raw inputs", files_to_create: ["founder-op-system-notes"], naming_convention: "YYYY-MM-DD-topic" }, { section: "Final Published", purpose: "Store ship-ready assets", files_to_create: ["launch-thread", "newsletter-issue-01"], naming_convention: "channel-title" }], tagging_system: ["#founder", "#creator", "#distribution", "#ai-ops"], moc_templates: ["Founder Systems MOC", "Creator OS MOC"], review_cadence: { daily: "Inbox triage", weekly: "Move assets to final sections", monthly: "Archive stale experiments" }, archival_criteria: "Archive assets that are shipped, superseded, or intentionally paused." };
    case "guardrail":
      return { flags: [{ type: "compliance", description: "Avoid implying guaranteed investor outcomes.", severity: "medium", fix: "Position outreach as discovery and fit." }, { type: "accuracy", description: "Keep live integration claims honest until credentials are connected.", severity: "low", fix: "Label demo mode clearly." }], cleared_for_outreach: true, cleared_for_publishing: true, risk_score: "low", recommendations: ["Keep demo/live states explicit", "Use verified sending domains before production outreach"] };
    case "imagegen":
      return { prompt: `FounderReach launch visual for ${topic}, editorial product mockup, bright neutral palette with Manta blue accents, premium SaaS art direction`, imageUrl: createPlaceholderImage(topic) };
    case "videogen":
      return { videoId: "demo-video", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", script: `FounderReach overview for ${topic}` };
    default:
      return { summary: `Completed work for ${topic} in ${industry}.` };
  }
}

function createPlaceholderImage(topic) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <rect width="1200" height="900" fill="#F8F9FB"/>
      <rect x="74" y="72" width="1052" height="756" rx="10" fill="#FFFFFF" stroke="#E9EAEE"/>
      <rect x="120" y="128" width="300" height="620" rx="10" fill="#F3F4F6"/>
      <rect x="450" y="128" width="606" height="120" rx="10" fill="#F3F4F6"/>
      <rect x="450" y="278" width="606" height="206" rx="10" fill="#F1F4FA" stroke="#DDE4F2"/>
      <rect x="450" y="512" width="286" height="206" rx="10" fill="#F3F4F6"/>
      <rect x="770" y="512" width="286" height="206" rx="10" fill="#F3F4F6"/>
      <rect x="120" y="56" width="120" height="8" rx="4" fill="#2563FF"/>
      <text x="120" y="96" fill="#181C23" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="600">FounderReach</text>
      <text x="120" y="790" fill="#181C23" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="600">${escapeXml(topic.slice(0, 36))}</text>
      <text x="120" y="832" fill="#7A8191" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="400">Agent orchestration for founders and creators</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[char]));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeRuntime(runtimeOrEnv = process.env) {
  if (runtimeOrEnv && typeof runtimeOrEnv === "object" && "env" in runtimeOrEnv) {
    return {
      env: runtimeOrEnv.env || process.env,
      demoMode: Boolean(runtimeOrEnv.demoMode || runtimeOrEnv.env?.FOUNDERREACH_FORCE_DEMO),
      sessionId: runtimeOrEnv.sessionId || "guest-session",
      origin: runtimeOrEnv.origin || "",
      timezone: runtimeOrEnv.timezone || "UTC",
    };
  }

  return {
    env: runtimeOrEnv,
    demoMode: Boolean(runtimeOrEnv?.FOUNDERREACH_FORCE_DEMO),
    sessionId: "guest-session",
    origin: "",
    timezone: "UTC",
  };
}

function buildActionModes(runtime, integrations = {}) {
  const publish = "demo";
  const research = runtime.env?.TINYFISH_API_KEY ? "live" : "needs-keys";

  if (runtime.demoMode) {
    return {
      sendEmail: "demo",
      bookMeeting: "demo",
      publish,
      research,
    };
  }

  return {
    sendEmail: integrations.gmail?.connected || hasAgentMail(runtime.env)
      ? "live"
      : hasComposio(runtime.env)
        ? "needs-account"
        : "needs-keys",
    bookMeeting: !hasComposio(runtime.env)
      ? "needs-keys"
      : integrations.googleCalendar?.connected
        ? "live"
        : "needs-account",
    publish,
    research,
  };
}

function describeActionMode(mode) {
  return {
    mode,
    label: ACTION_MODE_LABELS[mode] || ACTION_MODE_LABELS.demo,
  };
}

function buildMeetingEnvelope(contactName, contactCompany, timezone = "UTC") {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const dayIndex = Math.min(4, Math.max(0, (start.getDay() + 6) % 7));

  return {
    title: `Intro with ${contactName} (${contactCompany})`,
    with: contactName,
    company: contactCompany,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    timezone,
    day: dayIndex,
    slot: 2,
    bg: "#181C23",
    color: "#fff",
    status: "held",
  };
}

function sanitizeLeadPayload(payload = {}) {
  return {
    name: String(payload.name || "").trim(),
    email: String(payload.email || "").trim(),
    company: String(payload.company || "").trim(),
    role: String(payload.role || "").trim(),
    useCase: String(payload.useCase || "").trim(),
    preferredTime: String(payload.preferredTime || "").trim(),
    website: String(payload.website || "").trim(),
    source: String(payload.source || "launch-page").trim(),
    intent: "book-demo",
  };
}

function getEmailDomain(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized.includes("@")) return "";
  return normalized.split("@").pop() || "";
}

function buildEmailHtml(body = "") {
  return `<div dir="ltr" style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6;color:#181C23;">${escapeHtml(body).replace(/\n/g, "<br />")}</div>`;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function maybeForwardLeadToWebhook(lead, env = process.env) {
  const webhookUrl = String(env.FOUNDERREACH_LEAD_WEBHOOK_URL || "").trim();
  if (!webhookUrl) return false;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });

  return response.ok;
}

async function maybeSendLeadViaAgentMail(lead, env = process.env) {
  if (!hasAgentMail(env)) return false;

  const inboxId = String(env.AGENTMAIL_INBOX_ID || "").trim();
  const body = [
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Company: ${lead.company || "n/a"}`,
    `Role: ${lead.role || "n/a"}`,
    `Use case: ${lead.useCase}`,
    `Preferred time: ${lead.preferredTime || "n/a"}`,
    `Website: ${lead.website || "n/a"}`,
    `Source: ${lead.source}`,
    `Intent: ${lead.intent}`,
    `Lead ID: ${lead.id}`,
  ].join("\n");

  const response = await sendAgentMailMessage(
    {
      to: [inboxId],
      subject: `FounderReach demo request · ${lead.name}`,
      text: body,
      html: buildEmailHtml(body),
      replyTo: [lead.email],
      labels: ["lead", "book-demo", "founderreach"],
    },
    env
  );

  return Boolean(response?.message_id || response?.messageId);
}

async function maybeSendLeadEmail(lead, env = process.env) {
  const inbox = String(env.FOUNDERREACH_LEAD_EMAIL || "").trim();
  if (!inbox || !env.SENDGRID_API_KEY) return false;

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: inbox }] }],
      from: { email: inbox },
      subject: `FounderReach demo request · ${lead.name}`,
      content: [
        {
          type: "text/plain",
          value: [
            `Name: ${lead.name}`,
            `Email: ${lead.email}`,
            `Company: ${lead.company || "n/a"}`,
            `Role: ${lead.role || "n/a"}`,
            `Use case: ${lead.useCase}`,
            `Preferred time: ${lead.preferredTime || "n/a"}`,
            `Website: ${lead.website || "n/a"}`,
            `Source: ${lead.source}`,
            `Intent: ${lead.intent}`,
            `Lead ID: ${lead.id}`,
          ].join("\n"),
        },
      ],
    }),
  });

  return response.ok;
}

export function parseClientRuntimeConfig(rawValue, demoHeader = "", sessionHeader = "", originHeader = "", timezoneHeader = "") {
  let apiKeys = {};

  if (typeof rawValue === "string" && rawValue.length <= MAX_CLIENT_CONFIG_HEADER_LENGTH) {
    try {
      apiKeys = JSON.parse(rawValue);
      if (!apiKeys || typeof apiKeys !== "object" || Array.isArray(apiKeys)) {
        apiKeys = {};
      }
    } catch {
      apiKeys = {};
    }
  }

  return {
    apiKeys,
    demoMode: demoHeader === "1" || demoHeader === "true",
    sessionId: String(sessionHeader || "guest-session"),
    origin: String(originHeader || ""),
    timezone: String(timezoneHeader || "UTC"),
  };
}

export function resolveRuntimeEnv(baseEnv = process.env, { apiKeys = {}, demoMode = false } = {}) {
  const env = { ...baseEnv };

  CLIENT_KEY_ALLOWLIST.forEach((key) => {
    const value = typeof apiKeys?.[key] === "string" ? apiKeys[key].trim() : "";
    if (value) env[key] = value;
  });

  if (demoMode) env.FOUNDERREACH_FORCE_DEMO = "1";

  return env;
}

export function publicErrorMessage(error, env = process.env, fallback = "Internal Server Error") {
  if (env.NODE_ENV === "production") return fallback;
  return error instanceof Error ? error.message : String(error || fallback);
}

function uniqueValues(value, index, array) {
  return Boolean(value) && array.indexOf(value) === index;
}
