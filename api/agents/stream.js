import { executeAgentRun, parseClientRuntimeConfig, publicErrorMessage, resolveRuntimeEnv } from "../../lib/founderReachBackend.js";

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await request.json().catch(() => ({}));
    const runtime = parseClientRuntimeConfig(
      request.headers.get("x-founderreach-keys"),
      request.headers.get("x-founderreach-demo")
    );
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event, data) => {
          controller.enqueue(encoder.encode(`event: ${event}\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          const result = await executeAgentRun(
            body?.agentId,
            body?.context,
            send,
            resolveRuntimeEnv(process.env, runtime)
          );
          send("final", result);
          send("done", { ok: true });
        } catch (error) {
          const message = publicErrorMessage(error, process.env, "Run failed");
          send("final", {
            result: { error: message },
            summary: "Run failed",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  },
};
