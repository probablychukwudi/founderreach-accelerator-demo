import { getWorkspaceStatus } from "../lib/founderReachBackend.js";

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    return Response.json(getWorkspaceStatus());
  },
};
