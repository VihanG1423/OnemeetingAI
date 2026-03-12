import openai from "@/lib/openai";
import prisma from "@/lib/prisma";
import { SYSTEM_PROMPT, DEMO_PROMPTS, venueTools, executeVenueTool, scoreVenueMatches } from "@/lib/venue-tools";

export async function POST(request: Request) {
  const { messages, demoScenario, attachments } = await request.json();

  let systemContent = SYSTEM_PROMPT;
  if (demoScenario && DEMO_PROMPTS[demoScenario]) {
    systemContent += "\n\n" + DEMO_PROMPTS[demoScenario];
  }
  const systemMessage = { role: "system" as const, content: systemContent };

  // Build conversation messages, handling attachments on the last user message
  const conversationMessages = [systemMessage, ...messages.map((m: { role: string; content: string }, i: number) => {
    if (i === messages.length - 1 && m.role === "user" && attachments && attachments.length > 0) {
      const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
        { type: "text", text: m.content },
      ];

      for (const att of attachments) {
        if (att.type === "image") {
          contentParts.push({
            type: "image_url",
            image_url: { url: att.data },
          });
        } else if (att.type === "pdf") {
          contentParts.push({
            type: "text",
            text: `[Attached PDF: "${att.name}"]\n${att.data}`,
          });
        }
      }

      return { role: m.role, content: contentParts };
    }
    return m;
  })];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const currentMessages = [...conversationMessages];
        let continueLoop = true;
        let loopCount = 0;
        const MAX_TOOL_LOOPS = 10; // Safety limit to prevent infinite tool call loops

        while (continueLoop && loopCount < MAX_TOOL_LOOPS) {
          loopCount++;
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: currentMessages,
            tools: venueTools,
            stream: true,
          });

          const toolCalls = new Map<
            number,
            { id: string; name: string; arguments: string }
          >();
          let hasToolCalls = false;

          for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta;
            if (!delta) continue;

            // Accumulate tool calls
            if (delta.tool_calls) {
              hasToolCalls = true;
              for (const tc of delta.tool_calls) {
                const existing = toolCalls.get(tc.index) || {
                  id: "",
                  name: "",
                  arguments: "",
                };
                if (tc.id) existing.id = tc.id;
                if (tc.function?.name) existing.name = tc.function.name;
                if (tc.function?.arguments)
                  existing.arguments += tc.function.arguments;
                toolCalls.set(tc.index, existing);
              }
            }

            // Stream text content directly
            if (delta.content) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text", content: delta.content })}\n\n`
                )
              );
            }
          }

          if (hasToolCalls) {
            // Build assistant message with tool calls
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

            // Execute each tool and send results
            for (const tc of toolCallsArray) {
              const args = JSON.parse(tc.arguments);
              const result = await executeVenueTool(tc.name, args);

              // Send venue data to client for rendering cards (with match scores)
              if (tc.name === "search_venues") {
                try {
                  const venues = JSON.parse(result);
                  if (Array.isArray(venues) && venues.length > 0) {
                    // Score venues against the search criteria
                    const searchArgs = JSON.parse(tc.arguments);
                    const criteria = {
                      city: searchArgs.city,
                      capacity: searchArgs.minCapacity,
                      budget: searchArgs.maxBudget,
                      amenities: searchArgs.amenities,
                      venueType: searchArgs.venueType,
                    };

                    // Fetch full venue data for scoring
                    const fullVenues = await prisma.venue.findMany({
                      where: {
                        slug: { in: venues.map((v: { slug: string }) => v.slug) },
                      },
                    });

                    const toScore = fullVenues.map((v) => ({
                      id: v.id,
                      name: v.name,
                      slug: v.slug,
                      city: v.city,
                      capacity: v.capacity,
                      pricePerDay: v.pricePerDay,
                      venueType: v.venueType,
                      amenities: JSON.parse(v.amenities) as string[],
                      rating: v.rating,
                      description: v.description,
                      roomLayouts: v.roomLayouts,
                    }));

                    const scores = await scoreVenueMatches(criteria, toScore);

                    // Attach scores to venue cards
                    const venuesWithScores = venues.map(
                      (v: { slug: string }) => {
                        const fullVenue = fullVenues.find(
                          (fv) => fv.slug === v.slug
                        );
                        const score = scores.find(
                          (s) => s.venueId === fullVenue?.id
                        );
                        return { ...v, matchScore: score || null };
                      }
                    );

                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ type: "venues", content: venuesWithScores })}\n\n`
                      )
                    );

                    // Also inject match data into the tool result so AI can reference it
                    const enrichedResult = JSON.stringify(
                      venuesWithScores.map((v: Record<string, unknown>) => {
                        const ms = v.matchScore as Record<string, unknown> | null;
                        return {
                          ...v,
                          matchPercentage: ms?.matchPercentage ?? "N/A",
                          topHighlights: ms?.topHighlights ?? [],
                          missingRequirements: ms?.missingRequirements ?? [],
                        };
                      })
                    );
                    // Replace the tool result with enriched data
                    currentMessages.push({
                      role: "tool" as const,
                      tool_call_id: tc.id,
                      content: enrichedResult,
                    });
                    continue; // Skip the default push below
                  }
                } catch {
                  // Fall through to default handling
                }
              }

              if (tc.name === "create_booking_draft") {
                try {
                  const draft = JSON.parse(result);
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "booking_draft", content: draft })}\n\n`
                    )
                  );
                } catch {
                  // Skip
                }
              }

              if (tc.name === "suggest_options") {
                try {
                  const options = JSON.parse(tc.arguments).options as string[];
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "suggestions", content: options })}\n\n`
                    )
                  );
                } catch {
                  // Skip
                }
              }

              if (tc.name === "extract_url_content") {
                // No special client-side rendering — result goes back to AI for analysis
              }

              currentMessages.push({
                role: "tool" as const,
                tool_call_id: tc.id,
                content: result,
              });
            }
            // Loop to get AI response after tool results
          } else {
            continueLoop = false;
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "An error occurred";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", content: errorMsg })}\n\n`
          )
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
