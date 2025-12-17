export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy Groq API for frontend under /api/groq
    if (url.pathname === "/api/groq") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "https://giusepperubino.eu",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }

      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }

      const payload = await request.json();

      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      return new Response(await r.text(), {
        status: r.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://giusepperubino.eu",
        },
      });
    }

    // All other paths are handled by Cloudflare static assets binding
    return env.ASSETS.fetch(request);
  },
};
