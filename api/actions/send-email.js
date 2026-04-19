import { parseClientRuntimeConfig, resolveRuntimeEnv, sendEmailAction } from "../../lib/founderReachBackend.js";

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const body = await request.json().catch(() => ({}));
      const runtime = parseClientRuntimeConfig(
        request.headers.get("x-founderreach-keys"),
        request.headers.get("x-founderreach-demo")
      );
      return Response.json(await sendEmailAction(body?.contact, resolveRuntimeEnv(process.env, runtime)));
    } catch (error) {
      return new Response(error.message, { status: 500 });
    }
  },
};
