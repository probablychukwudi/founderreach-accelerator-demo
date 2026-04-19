import { bookMeetingAction } from "../../lib/founderReachBackend.js";

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const body = await request.json().catch(() => ({}));
      return Response.json(await bookMeetingAction(body?.contact));
    } catch (error) {
      return new Response(error.message, { status: 500 });
    }
  },
};
