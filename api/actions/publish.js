import { publicErrorMessage, publishAction } from "../../lib/founderReachBackend.js";

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const body = await request.json().catch(() => ({}));
      return Response.json(await publishAction(body?.asset));
    } catch (error) {
      return new Response(publicErrorMessage(error), { status: 500 });
    }
  },
};
