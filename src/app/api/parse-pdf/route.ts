import { PDFParse } from "pdf-parse";

export async function POST(request: Request) {
  try {
    const { base64Data, fileName } = await request.json();

    if (!base64Data) {
      return Response.json({ error: "No PDF data provided" }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(base64Data, "base64");
    const parser = new PDFParse({ data: pdfBuffer });
    const result = await parser.getText();

    return Response.json({
      text: result.text.slice(0, 10000),
      pages: result.pages.length,
      fileName,
    });
  } catch {
    return Response.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}
