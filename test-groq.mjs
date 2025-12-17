const key = process.env.GROQ_API_KEY;
if (!key) {
  console.error("Missing GROQ_API_KEY in env");
  process.exit(1);
}

const payload = {
  model: "llama-3.1-8b-instant",
  messages: [{ role: "system", content: "test" }],
  max_tokens: 5,
};

const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${key}`,
  },
  body: JSON.stringify(payload),
});

console.log("STATUS:", r.status);
console.log(await r.text());
