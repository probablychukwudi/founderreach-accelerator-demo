import { parseClientRuntimeConfig, publicErrorMessage, publishAction, resolveRuntimeEnv } from "../../lib/founderReachBackend.js";

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const body = await request.json().catch(() => ({}));
      const runtime = parseClientRuntimeConfig(
        request.headers.get("x-founderreach-keys"),
        request.headers.get("x-founderreach-demo"),
        request.headers.get("x-founderreach-session"),
        request.headers.get("x-founderreach-origin"),
        request.headers.get("x-founderreach-timezone")
      );
      return Response.json(await publishAction(body?.asset, { ...runtime, env: resolveRuntimeEnv(process.env, runtime) }));
    } catch (error) {
      return new Response(publicErrorMessage(error), { status: 500 });
    }
  },
};
