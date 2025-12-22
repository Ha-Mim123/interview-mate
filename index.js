export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/evaluate") {
      return new Response("Not Found", { status: 404 });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { question, answer } = await request.json();

    const prompt = `You are an interview coach.
Question: ${question}
Answer: ${answer}

Return STRICT JSON only:
{"score":0-10,"feedback":["..."],"improved_answer":"..."}`;

    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: "You are a strict interview evaluator." },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await openaiResp.json();

    return new Response(JSON.stringify({
      raw: data?.choices?.[0]?.message?.content || "{}",
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};
