import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, email, phone, requirements, criteria } = await request.json();

    if (!name || !email || !requirements) {
      return NextResponse.json(
        { error: "Name, email, and requirements are required" },
        { status: 400 }
      );
    }

    const expertRequest = await prisma.expertRequest.create({
      data: {
        name,
        email,
        phone: phone || null,
        requirements,
        criteria: criteria ? JSON.stringify(criteria) : null,
      },
    });

    return NextResponse.json({ id: expertRequest.id, status: "pending" });
  } catch (error) {
    console.error("Expert request error:", error);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}
