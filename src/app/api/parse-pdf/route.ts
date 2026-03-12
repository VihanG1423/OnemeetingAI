import pdf from "pdf-parse/lib/pdf-parse.js";

export async function POST(request: Request) {
  try {
    const { base64Data, fileName } = await request.json();

    if (!base64Data) {
      return Response.json({ error: "No PDF data provided" }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(base64Data, "base64");
    const data = await pdf(pdfBuffer);

    return Response.json({
      text: data.text.slice(0, 10000),
      pages: data.numpages,
      fileName,
    });
  } catch {
    return Response.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}
