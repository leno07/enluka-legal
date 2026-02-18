import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const DIRECTION_EXTRACTION_PROMPT = `You are a UK legal assistant specialising in court procedure. Your task is to extract all court directions from the provided court order document.

For EACH direction in the order, extract:
1. orderNumber: Sequential number (1, 2, 3...) as they appear in the document
2. title: A brief 5-10 word summary of the direction
3. description: The full verbatim text of the direction as written in the order
4. dueDate: The deadline in ISO format (YYYY-MM-DD). If the date is relative (e.g., "28 days from the date of this order", "by 4pm on 15 March 2026"), calculate and provide the absolute date. If no date can be determined, use null.
5. responsibleParty: Who must comply (e.g., "Claimant", "Defendant", "Both parties", "Claimant's solicitor"). Use null if not specified.
6. confidence: Your confidence in the extraction accuracy from 0.0 to 1.0. Use lower scores when dates are ambiguous or text is unclear.

Also extract from the order header:
- courtName: The name of the court
- caseNumber: The case/claim number
- judgeName: The judge's name/title
- orderDate: The date of the order in ISO format

Return your response as a valid JSON object with this exact structure:
{
  "courtName": "string or null",
  "caseNumber": "string or null",
  "judgeName": "string or null",
  "orderDate": "string (YYYY-MM-DD) or null",
  "directions": [
    {
      "orderNumber": 1,
      "title": "string",
      "description": "string",
      "dueDate": "string (YYYY-MM-DD) or null",
      "responsibleParty": "string or null",
      "confidence": 0.95
    }
  ]
}

Important rules:
- Preserve the exact legal language in descriptions
- For relative dates, calculate from the orderDate
- If a direction has multiple deadlines, create separate entries
- Standard directions (e.g., "liberty to apply") with no deadline should still be extracted with dueDate: null
- Only return valid JSON, no other text`;

export interface ExtractedDirection {
  orderNumber: number;
  title: string;
  description: string;
  dueDate: string | null;
  responsibleParty: string | null;
  confidence: number;
}

export interface ExtractionResult {
  courtName: string | null;
  caseNumber: string | null;
  judgeName: string | null;
  orderDate: string | null;
  directions: ExtractedDirection[];
}

export async function extractDirectionsFromPdf(
  pdfBase64: string
): Promise<ExtractionResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            type: "text",
            text: DIRECTION_EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude API");
  }

  // Extract JSON from the response (handle potential markdown wrapping)
  let jsonStr = textContent.text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const result: ExtractionResult = JSON.parse(jsonStr);
  return result;
}
