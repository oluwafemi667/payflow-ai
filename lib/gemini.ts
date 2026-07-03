const GEMINI_MODEL = "gemini-2.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface ParsedInvoiceFields {
  customer_name: string | null;
  customer_email: string | null;
  description: string | null;
  amount: number | null;
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    customer_name: { type: "string", nullable: true },
    customer_email: { type: "string", nullable: true },
    description: { type: "string", nullable: true },
    amount: { type: "number", nullable: true },
  },
  required: ["customer_name", "customer_email", "description", "amount"],
};

const SYSTEM_INSTRUCTION = `You extract invoice details from a Nigerian small business owner's casual, spoken-style description of a sale. Extract:
- customer_name: the person being invoiced
- customer_email: an email address if one is mentioned, otherwise null (do not invent one)
- description: a short, clean description of what was sold or the service rendered
- amount: the amount in Naira as a plain number (no currency symbol, no commas). Interpret shorthand like "15k" as 15000, "2k" as 2000.

If a field genuinely isn't mentioned, return null for it rather than guessing. Respond with JSON only, matching the schema exactly.`;

export async function parseInvoiceText(text: string): Promise<ParsedInvoiceFields> {
  const apiKey = process.env.GEMINI_API_KEY!;

  const res = await fetch(`${API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.1,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini request failed: ${res.status} ${errText}`);
  }

  const json = await res.json();
  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("Gemini returned no parseable content");
  }

  return JSON.parse(rawText) as ParsedInvoiceFields;
}
