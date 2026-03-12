import openai from "@/lib/openai";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const { aiMessage, demoScenario, conversationHistory } = await request.json();

  // Fetch real venue data so the auto-reply can reference actual venues
  // For expertCta scenario, skip venue context — the simulated user should NOT
  // steer requirements toward existing venues (they should be unsatisfied)
  let venueContext = "";
  if (demoScenario !== "expertCta") {
    try {
      const targetCity = demoScenario === "perfectMatch" ? "Amsterdam" : undefined;

      const venues = await prisma.venue.findMany({
        where: targetCity ? { city: targetCity } : undefined,
        orderBy: { rating: "desc" },
        take: 15,
      });

      if (venues.length > 0) {
        const venueList = venues.map(v => {
          const amenities = JSON.parse(v.amenities) as string[];
          return `  - "${v.name}" in ${v.city}: ${v.capacity} guests, €${v.pricePerDay}/day, type: ${v.venueType}, amenities: ${amenities.join(", ")}`;
        }).join("\n");

        venueContext = `\nVENUES ACTUALLY AVAILABLE ON THE PLATFORM:\n${venueList}\n\nIMPORTANT: When the AI advisor shows you venue results or asks about preferences, reference criteria that align with these REAL venues. Never mention venue names directly (you wouldn't know them), but steer your requirements toward what these venues actually offer.\n`;
      }
    } catch {
      // If DB query fails, continue without venue context
    }
  }

  const scenarioContext =
    demoScenario === "perfectMatch"
      ? `You are planning a corporate leadership retreat for 30-50 people in or near Amsterdam.
Budget: €3,000-5,000 per day. You need breakout rooms, catering, and modern AV equipment.
Dates are flexible but ideally in the next 2-3 months. You prefer a venue with natural light and good transport links.`
      : demoScenario === "expertCta"
        ? `You are planning a very exclusive, ultra-premium event for 40-60 VIP guests (C-level executives, diplomats, or high-profile individuals).

YOUR ULTRA-SPECIFIC REQUIREMENTS (mention these progressively across the conversation):
- Private exclusive-hire only — no shared spaces or other events happening simultaneously
- On-site Michelin-starred or celebrity chef for a curated 7-course tasting menu
- Helicopter landing pad or private car service from Schiphol
- Castle, vineyard estate, or historic manor house setting — NOT a standard conference center or hotel
- Diplomatic-grade security with vetted staff and NDA agreements
- Wine cellar or private tasting room for post-dinner networking
- Butler service and personal concierge for each VIP table
- Outdoor garden or terrace with heated pavilion for cocktail reception

BEHAVIOR:
- When the AI presents venue options, be POLITE but UNSATISFIED — acknowledge the suggestions but point out they don't meet your premium standards
- Say things like: "These look nice but I need something more exclusive", "Do you have anything with a private Michelin chef on-site?", "I was hoping for more of a castle or estate setting"
- NEVER pick a venue to book — always express that none quite match your vision
- If the AI recommends speaking to an expert/specialist, respond POSITIVELY: "That sounds perfect, I'd love to speak with someone who has access to those premium venues"
- Keep raising new niche requirements that standard venues can't satisfy`
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
- NEVER invent venue names — only reference venues the AI has mentioned to you
${demoScenario === "expertCta"
  ? `- When the AI presents venue options, be POLITE but UNSATISFIED — point out what's missing from your premium standards
- NEVER pick a venue to book or ask about availability — none of them meet your standards
- Keep raising ultra-premium requirements (Michelin chef, helicopter access, castle settings, diplomatic security, private wine cellar, butler service)
- If the AI recommends a specialist or expert, respond enthusiastically — that's exactly what you need`
  : `- When the AI presents venue options, respond positively and pick one to explore further — ask about availability or details`}

YOUR SCENARIO:
${scenarioContext}
${venueContext}
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
