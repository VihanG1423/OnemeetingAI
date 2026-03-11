import openai from "@/lib/openai";
import type OpenAI from "openai";

const VENUE_LISTING_SYSTEM_PROMPT = `You are OneMeeting's AI venue listing assistant. You help venue owners create professional, accurate listings for their meeting venues on the OneMeeting platform.

IMPORTANT RULES:
- ONLY use information the venue owner has explicitly provided. NEVER invent or assume details.
- If you need information to fill a field, ASK the owner using the ask_owner tool.
- Be conversational and guide the owner through the process step by step.
- Start by reviewing what information you already have, then ask about missing details.
- When you have enough info for a section, use the appropriate update tool to fill it in.
- The owner can see a live preview updating in real-time as you make changes.

WORKFLOW:
1. Greet the owner and summarize the basic info they've already provided
2. Ask targeted questions to gather details needed for a great listing
3. Use update tools to populate the listing fields as you learn more
4. After each update, briefly confirm what you've added and ask about the next section
5. Suggest improvements and let the owner refine

SECTIONS TO COMPLETE (in order of priority):
- Description & tagline (ask about atmosphere, ideal events, unique selling points)
- Amenities (ask what's available - wifi, catering, projector, etc.)
- Facilities (ask about specific room features, technology, comfort items)
- Room layouts (ask about room names, and capacity per layout type - ONLY if they have this info)
- Transport info (ask about nearest station, public transport access)
- Parking info (ask about parking availability, cost, EV charging)
- Terms & conditions (ask about cancellation policy, setup/cleanup time)
- Sustainability (ask about eco initiatives, certifications)

TONE: Professional but friendly. Like a helpful colleague who knows the venue industry well.`;

const listingTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "update_description",
      description: "Update the venue description and/or short tagline. Only call this when you have enough information from the owner to write an accurate description.",
      parameters: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "3-4 sentence professional description based ONLY on what the owner told you",
          },
          shortDescription: {
            type: "string",
            description: "Catchy one-liner tagline (max 80 chars)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_amenities",
      description: "Update the venue amenities list. Only include amenities the owner has confirmed.",
      parameters: {
        type: "object",
        properties: {
          amenities: {
            type: "array",
            items: { type: "string", enum: ["wifi", "catering", "projector", "av_equipment", "breakout_rooms", "parking", "accessibility", "video_conferencing", "whiteboard", "kitchen", "natural_light", "outdoor_space"] },
            description: "Array of confirmed amenity keys",
          },
        },
        required: ["amenities"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_facilities",
      description: "Update the categorized facilities list. Only include items the owner has confirmed or that directly follow from confirmed information.",
      parameters: {
        type: "object",
        properties: {
          facilities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string", description: "Category name like 'Meeting Essentials', 'Technology', 'Comfort & Catering', 'Access & Parking'" },
                items: { type: "array", items: { type: "string" }, description: "Facility items in this category" },
              },
              required: ["category", "items"],
            },
          },
        },
        required: ["facilities"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_room_layouts",
      description: "Update room layout configurations. Only include layouts the owner has provided capacity numbers for.",
      parameters: {
        type: "object",
        properties: {
          roomLayouts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Room name" },
                theater: { type: "number", nullable: true },
                classroom: { type: "number", nullable: true },
                uShape: { type: "number", nullable: true },
                boardroom: { type: "number", nullable: true },
                cabaret: { type: "number", nullable: true },
                reception: { type: "number", nullable: true },
              },
              required: ["name"],
            },
          },
        },
        required: ["roomLayouts"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_transport",
      description: "Update transport and parking information. Only use details the owner has provided.",
      parameters: {
        type: "object",
        properties: {
          transportInfo: { type: "string", description: "Transport directions based on owner-provided info" },
          parkingInfo: { type: "string", description: "Parking details based on owner-provided info" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_terms",
      description: "Update terms & conditions and sustainability info. Only use details the owner has provided.",
      parameters: {
        type: "object",
        properties: {
          termsAndConditions: { type: "string", description: "Terms based on owner-provided policies" },
          sustainabilityInfo: { type: "string", description: "Sustainability info based on owner-provided initiatives" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_owner",
      description: "Ask the venue owner a question to gather information needed for the listing. Use this to gather specifics rather than guessing. You can provide suggested options to make it easier for the owner to respond.",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The question to ask the venue owner",
          },
          suggestions: {
            type: "array",
            items: { type: "string" },
            description: "Optional quick-reply suggestions the owner can click",
          },
        },
        required: ["question"],
      },
    },
  },
];

export async function POST(request: Request) {
  const { messages, venueData } = await request.json();

  // Build context about what the owner has already provided
  const venueContext = `
VENUE BASIC INFO (already provided by owner):
- Name: ${venueData.name}
- City: ${venueData.city}
- Address: ${venueData.address}
- Type: ${venueData.venueType?.replace(/_/g, " ") || "Not specified"}
- Capacity: ${venueData.capacity || "Not specified"} persons
- Price per day: €${venueData.pricePerDay || "Not specified"}
- Price per half day: €${venueData.pricePerHalfDay || "Not specified"}
- Phone: ${venueData.phoneNumber || "Not provided"}
- Email: ${venueData.email || "Not provided"}
${venueData.additionalDetails ? `- Additional details from owner: "${venueData.additionalDetails}"` : "- No additional details provided"}

CURRENT LISTING STATE (what's been filled so far):
- Description: ${venueData.description ? "Set" : "Empty"}
- Tagline: ${venueData.shortDescription ? "Set" : "Empty"}
- Amenities: ${venueData.amenities?.length ? venueData.amenities.join(", ") : "Empty"}
- Facilities: ${venueData.facilities?.length ? `${venueData.facilities.length} categories` : "Empty"}
- Room layouts: ${venueData.roomLayouts?.length ? `${venueData.roomLayouts.length} rooms` : "Empty"}
- Transport: ${venueData.transportInfo ? "Set" : "Empty"}
- Parking: ${venueData.parkingInfo ? "Set" : "Empty"}
- Terms: ${venueData.termsAndConditions ? "Set" : "Empty"}
- Sustainability: ${venueData.sustainabilityInfo ? "Set" : "Empty"}
`;

  const systemMessage = {
    role: "system" as const,
    content: VENUE_LISTING_SYSTEM_PROMPT + "\n\n" + venueContext,
  };

  const conversationMessages = [systemMessage, ...messages];
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const currentMessages = [...conversationMessages];
        let continueLoop = true;

        while (continueLoop) {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: currentMessages,
            tools: listingTools,
            stream: true,
          });

          const toolCalls = new Map<number, { id: string; name: string; arguments: string }>();
          let hasToolCalls = false;

          for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta;
            if (!delta) continue;

            if (delta.tool_calls) {
              hasToolCalls = true;
              for (const tc of delta.tool_calls) {
                const existing = toolCalls.get(tc.index) || { id: "", name: "", arguments: "" };
                if (tc.id) existing.id = tc.id;
                if (tc.function?.name) existing.name = tc.function.name;
                if (tc.function?.arguments) existing.arguments += tc.function.arguments;
                toolCalls.set(tc.index, existing);
              }
            }

            if (delta.content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "text", content: delta.content })}\n\n`)
              );
            }
          }

          if (hasToolCalls) {
            const toolCallsArray = Array.from(toolCalls.values());
            currentMessages.push({
              role: "assistant" as const,
              content: null,
              tool_calls: toolCallsArray.map((tc) => ({
                id: tc.id,
                type: "function" as const,
                function: { name: tc.name, arguments: tc.arguments },
              })),
            });

            for (const tc of toolCallsArray) {
              const args = JSON.parse(tc.arguments);

              // Send field updates to client
              if (tc.name.startsWith("update_")) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "field_update", tool: tc.name, content: args })}\n\n`)
                );
                currentMessages.push({
                  role: "tool" as const,
                  tool_call_id: tc.id,
                  content: JSON.stringify({ success: true, updated: Object.keys(args) }),
                });
              } else if (tc.name === "ask_owner") {
                // Send question with suggestions to client
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "question", content: args })}\n\n`)
                );
                currentMessages.push({
                  role: "tool" as const,
                  tool_call_id: tc.id,
                  content: JSON.stringify({ delivered: true, question: args.question }),
                });
              } else {
                currentMessages.push({
                  role: "tool" as const,
                  tool_call_id: tc.id,
                  content: JSON.stringify({ error: "Unknown tool" }),
                });
              }
            }
          } else {
            continueLoop = false;
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "An error occurred";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", content: errorMsg })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
