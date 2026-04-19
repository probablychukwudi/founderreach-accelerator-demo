import { buildPlan } from "../lib/founderReachBackend.js";

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const body = await request.json().catch(() => ({}));
      const prompt = body?.prompt || "";
      const history = body?.history || [];
      return Response.json(await buildPlan(prompt, history));
    } catch (error) {
      return new Response(error.message, { status: 500 });
    }
  },
};
