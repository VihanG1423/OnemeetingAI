import openai from "@/lib/openai";

export async function POST(request: Request) {
  const { aiQuestion, venueData } = await request.json();

  const venueContext = `
VENUE INFO:
- Name: ${venueData.name}
- City: ${venueData.city}
- Address: ${venueData.address}
- Type: ${venueData.venueType?.replace(/_/g, " ") || "venue"}
- Capacity: ${venueData.capacity || "unknown"}
- Price per day: €${venueData.pricePerDay || "unknown"}
- Price per half day: €${venueData.pricePerHalfDay || "unknown"}
- Phone: ${venueData.phoneNumber || "not provided"}
- Email: ${venueData.email || "not provided"}
${venueData.additionalDetails ? `- Additional details: "${venueData.additionalDetails}"` : ""}
`.trim();

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a venue owner responding to questions from an AI listing assistant that is helping you create your venue listing.

RULES:
- Answer the question directly with realistic, detailed information about your venue
- Base your answers on the venue info provided, and EXPAND with plausible details that fit the venue type and location
- Keep answers concise (2-4 sentences max) — you're chatting, not writing an essay
- Sound like a real venue owner who knows their space well
- If asked about multiple things, cover them all briefly
- Include specific numbers where relevant (capacities, distances, prices)
- For Dutch venues, reference real nearby landmarks, stations, and areas when relevant

${venueContext}`,
        },
        {
          role: "user",
          content: `The AI listing assistant just asked me this:\n\n"${aiQuestion}"\n\nHow should I respond?`,
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
