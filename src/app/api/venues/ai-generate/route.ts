import { NextResponse } from "next/server";
import openai from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, city, address, venueType, capacity, pricePerDay, pricePerHalfDay, additionalDetails } = body;

    if (!name || !city) {
      return NextResponse.json({ error: "Name and city are required" }, { status: 400 });
    }

    const venueTypeLabel = venueType?.replace(/_/g, " ") || "meeting venue";

    const prompt = `You are an expert venue listing copywriter for OneMeeting, a premium meeting venue platform in the Netherlands. Generate professional venue listing content for the following venue:

Name: ${name}
City: ${city}
Address: ${address || "Not specified"}
Type: ${venueTypeLabel}
Capacity: ${capacity || "Not specified"} persons
Price per day: €${pricePerDay || "Not specified"}
Price per half day: €${pricePerHalfDay || "Not specified"}
${additionalDetails ? `Additional details from owner: ${additionalDetails}` : ""}

Generate a complete venue listing in JSON format with these fields:
{
  "description": "A compelling 3-4 sentence description of the venue highlighting unique features, ideal use cases, and atmosphere. Professional tone.",
  "shortDescription": "A catchy one-line tagline (max 80 chars) that captures the venue's essence.",
  "amenities": ["array of amenity keys from: wifi, catering, projector, av_equipment, breakout_rooms, parking, accessibility, video_conferencing, whiteboard, kitchen, natural_light, outdoor_space"],
  "facilities": [
    { "category": "Meeting Essentials", "items": ["Free high-speed WiFi", "Climate control", ...] },
    { "category": "Technology", "items": [...] },
    { "category": "Comfort & Catering", "items": [...] },
    { "category": "Access & Parking", "items": [...] }
  ],
  "roomLayouts": [
    { "name": "Main Room Name", "theater": number, "classroom": number, "uShape": number, "boardroom": number, "cabaret": number, "reception": number }
  ],
  "transportInfo": "Brief directions from nearest train station and public transport options.",
  "parkingInfo": "Parking availability, cost, and EV charging if applicable.",
  "termsAndConditions": "Standard venue terms including cancellation policy, setup time, etc.",
  "sustainabilityInfo": "Sustainability initiatives (make reasonable assumptions for the venue type and location)."
}

Make the content authentic and specific to ${city}, Netherlands. Use realistic Dutch addresses for transport info. Room layout capacities should be realistic for a ${capacity || 50}-person ${venueTypeLabel}. Return ONLY valid JSON, no markdown.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || "{}";

    // Parse the JSON response, handling potential markdown wrapping
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "AI returned invalid format", raw: content }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate venue content" },
      { status: 500 }
    );
  }
}
