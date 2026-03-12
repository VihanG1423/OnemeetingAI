import openai from "@/lib/openai";

export async function POST(request: Request) {
  const { aiMessage, demoScenario, conversationHistory } = await request.json();

  const scenarioContext =
    demoScenario === "perfectMatch"
      ? `You are planning a corporate leadership retreat for 30-50 people in or near Amsterdam.
Budget: €3,000-5,000 per day. You need breakout rooms, catering, and modern AV equipment.
Dates are flexible but ideally in the next 2-3 months. You prefer a venue with natural light and good transport links.`
      : demoScenario === "expertCta"
        ? `You are planning a very exclusive, high-end event for 40-60 VIP guests.
You want something extraordinary — think castles, Michelin-star dining, helicopter access, vineyard settings.
Budget is not a primary concern but you expect premium quality. You are very particular about details.`
        : `You are an event planner looking for a meeting venue in the Netherlands.
You have general requirements but are open to suggestions from the AI advisor.`;

  const conversationContext = conversationHistory?.length
    ? `\nCONVERSATION SO FAR:\n${conversationHistory
        .slice(-10)
        .map((m: { role: string; content: string }) => `${m.role === "user" ? "You" : "AI Advisor"}: ${m.content.slice(0, 200)}`)
        .join("\n")}\n`
    : "";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an event planner responding to an AI venue advisor that is helping you find the perfect venue.

RULES:
- Answer the AI advisor's questions directly with realistic, specific details
- Keep answers concise (2-4 sentences max) — you're chatting, not writing an essay
- Sound like a real corporate event planner who knows what they want
- If asked about multiple things, cover them all briefly
- Include specific numbers where relevant (attendees, budget, dates)
- DO NOT repeat information you've already provided in the conversation
- Focus your answer on the specific NEW topic being asked about
- Be decisive and give clear preferences when asked

YOUR SCENARIO:
${scenarioContext}
${conversationContext}`,
        },
        {
          role: "user",
          content: `The AI venue advisor just said:\n\n"${aiMessage}"\n\nHow should I respond?`,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const reply = response.choices[0]?.message?.content || "";
    return Response.json({ reply });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to generate reply";
    return Response.json({ reply: "", error: msg }, { status: 500 });
  }
}
