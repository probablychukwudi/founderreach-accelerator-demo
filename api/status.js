import { getWorkspaceStatus, parseClientRuntimeConfig, resolveRuntimeEnv } from "../lib/founderReachBackend.js";

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const runtime = parseClientRuntimeConfig(
      request.headers.get("x-founderreach-keys"),
      request.headers.get("x-founderreach-demo"),
      request.headers.get("x-founderreach-session"),
      request.headers.get("x-founderreach-origin"),
      request.headers.get("x-founderreach-timezone")
    );

    return Response.json(await getWorkspaceStatus({ ...runtime, env: resolveRuntimeEnv(process.env, runtime) }));
  },
};
