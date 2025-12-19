export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy Groq API for frontend under /api/groq
    if (url.pathname === "/api/groq") {
      try {
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

        let payload;
        try {
          payload = await request.json();
        } catch (err) {
          console.error("GROQ_PARSE_JSON_ERROR", err);
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const groqKey = env.GROQ_API_KEY || env.VITE_GROQ_API_KEY;
        console.log("GROQ_HAS_KEY", Boolean(groqKey));
        if (!groqKey) {
          console.error("GROQ_MISSING_KEY");
          return Response.json({ error: "Missing GROQ_API_KEY" }, { status: 500 });
        }

        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`,
          },
          body: JSON.stringify(payload),
        });

        const text = await r.text();
        console.log("GROQ_STATUS", r.status);
        if (!r.ok) {
          console.error("GROQ_BODY", text.slice(0, 500));
        }

        return new Response(text, {
          status: r.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "https://giusepperubino.eu",
          },
        });
      } catch (err) {
        console.error("GROQ_FATAL", err);
        return Response.json({ error: "Worker crashed" }, { status: 500 });
      }
    }

    // All other paths are handled by Cloudflare static assets binding
    return env.ASSETS.fetch(request);
  },
};
