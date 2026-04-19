import "dotenv/config";
import cors from "cors";
import express from "express";
import {
  bookMeetingAction,
  buildPlan,
  createIntegrationLink,
  executeAgentRun,
  getWorkspaceStatus,
  parseClientRuntimeConfig,
  publicErrorMessage,
  publishAction,
  resolveRuntimeEnv,
  sendEmailAction,
  submitLeadCapture,
} from "../lib/founderReachBackend.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const allowedOrigins = new Set(
  (process.env.FOUNDERREACH_ALLOWED_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

app.disable("x-powered-by");
app.set("trust proxy", false);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS origin not allowed"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "x-founderreach-keys",
      "x-founderreach-demo",
      "x-founderreach-session",
      "x-founderreach-origin",
      "x-founderreach-timezone",
    ],
    maxAge: 600,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

function sendError(res, error, status = 500, fallback = "Internal Server Error") {
  res.status(status).json({ error: publicErrorMessage(error, process.env, fallback) });
}

function runtimeEnvForRequest(req) {
  const runtime = parseClientRuntimeConfig(
    req.header("x-founderreach-keys"),
    req.header("x-founderreach-demo"),
    req.header("x-founderreach-session"),
    req.header("x-founderreach-origin"),
    req.header("x-founderreach-timezone")
  );
  return {
    ...runtime,
    env: resolveRuntimeEnv(process.env, runtime),
  };
}

app.get("/api/status", async (req, res) => {
  try {
    res.json(await getWorkspaceStatus(runtimeEnvForRequest(req)));
  } catch (error) {
    sendError(res, error);
  }
});

app.post("/api/orchestrate", async (req, res) => {
  try {
    const prompt = req.body?.prompt || "";
    const history = req.body?.history || [];
    res.json(await buildPlan(prompt, history, runtimeEnvForRequest(req).env));
  } catch (error) {
    sendError(res, error);
  }
});

app.post("/api/agents/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { agentId, context } = req.body || {};
    const result = await executeAgentRun(agentId, context, send, runtimeEnvForRequest(req).env);
    send("final", result);
    send("done", { ok: true });
  } catch (error) {
    send("final", {
      result: { error: publicErrorMessage(error, process.env, "Run failed") },
      summary: "Run failed",
    });
  } finally {
    res.end();
  }
});

app.post("/api/actions/send-email", async (req, res) => {
  try {
    res.json(await sendEmailAction(req.body?.contact, runtimeEnvForRequest(req)));
  } catch (error) {
    sendError(res, error);
  }
});

app.post("/api/actions/book-meeting", async (req, res) => {
  try {
    res.json(await bookMeetingAction(req.body?.contact, runtimeEnvForRequest(req)));
  } catch (error) {
    sendError(res, error);
  }
});

app.post("/api/actions/publish", async (req, res) => {
  try {
    res.json(await publishAction(req.body?.asset, runtimeEnvForRequest(req)));
  } catch (error) {
    sendError(res, error);
  }
});

app.post("/api/lead", async (req, res) => {
  try {
    res.json(await submitLeadCapture(req.body, runtimeEnvForRequest(req)));
  } catch (error) {
    sendError(res, error, 400, "Unable to capture lead");
  }
});

app.post("/api/integrations/connect", async (req, res) => {
  try {
    const toolkit = req.body?.toolkit || "";
    res.json(await createIntegrationLink(toolkit, runtimeEnvForRequest(req)));
  } catch (error) {
    sendError(res, error, 400, "Unable to start connection");
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.use((error, _req, res, _next) => {
  sendError(res, error);
});

app.listen(port, () => {
  console.log(`FounderReach server listening on http://localhost:${port}`);
});
