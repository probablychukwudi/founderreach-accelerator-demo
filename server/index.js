import "dotenv/config";
import cors from "cors";
import express from "express";
import {
  bookMeetingAction,
  buildPlan,
  executeAgentRun,
  getWorkspaceStatus,
  parseClientRuntimeConfig,
  publishAction,
  resolveRuntimeEnv,
  sendEmailAction,
} from "../lib/founderReachBackend.js";

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function runtimeEnvForRequest(req) {
  const { apiKeys, demoMode } = parseClientRuntimeConfig(
    req.header("x-founderreach-keys"),
    req.header("x-founderreach-demo")
  );
  return resolveRuntimeEnv(process.env, { apiKeys, demoMode });
}

app.get("/api/status", (_req, res) => {
  res.json(getWorkspaceStatus(runtimeEnvForRequest(_req)));
});

app.post("/api/orchestrate", async (req, res) => {
  try {
    const prompt = req.body?.prompt || "";
    const history = req.body?.history || [];
    res.json(await buildPlan(prompt, history, runtimeEnvForRequest(req)));
  } catch (error) {
    res.status(500).send(error.message);
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
    const result = await executeAgentRun(agentId, context, send, runtimeEnvForRequest(req));
    send("final", result);
    send("done", { ok: true });
  } catch (error) {
    send("final", {
      result: { error: error.message },
      summary: `Run failed: ${error.message}`,
    });
  } finally {
    res.end();
  }
});

app.post("/api/actions/send-email", async (req, res) => {
  try {
    res.json(await sendEmailAction(req.body?.contact, runtimeEnvForRequest(req)));
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/api/actions/book-meeting", async (req, res) => {
  try {
    res.json(await bookMeetingAction(req.body?.contact));
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/api/actions/publish", async (req, res) => {
  try {
    res.json(await publishAction(req.body?.asset));
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`FounderReach server listening on http://localhost:${port}`);
});
