import { GoogleGenAI } from "@google/genai";
import type { MedicationSchedulePayload } from "@/lib/medications/types";
import {
  MEDICATION_EXTRACT_SCHEMA_HINT,
  MEDICATION_EXTRACT_SYSTEM_PROMPT,
  buildMedicationExtractFullPrompt,
  buildMedicationExtractUserContent,
  parseAndNormalizeMedicationPayload,
} from "@/lib/medications/parseMedicationPayload";

const GEMINI_EXTRACT_MODEL = "gemini-2.0-flash";
const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_EXTRACT_MODEL = "llama-3.3-70b-versatile";

export type MedicationExtractProvider = "auto" | "groq" | "gemini";

function getProvider(): MedicationExtractProvider {
  const v = process.env.NEXT_PUBLIC_MEDICATION_EXTRACT_PROVIDER?.trim().toLowerCase();
  if (v === "groq" || v === "gemini") return v;
  return "auto";
}

export function canExtractMedicationSchedule(): boolean {
  const provider = getProvider();
  const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY?.trim();
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY?.trim();
  if (provider === "groq") return Boolean(groqKey);
  if (provider === "gemini") return Boolean(googleKey);
  return Boolean(groqKey || googleKey);
}

async function extractWithGemini(
  apiKey: string,
  params: { documentText: string; heardText: string; replyText: string },
): Promise<MedicationSchedulePayload> {
  const ai = new GoogleGenAI({ apiKey });
  const contents = buildMedicationExtractFullPrompt(params);
  const response = await ai.models.generateContent({
    model: GEMINI_EXTRACT_MODEL,
    contents,
    config: {
      responseMimeType: "application/json",
    },
  });
  return parseAndNormalizeMedicationPayload(response.text);
}

async function extractWithGroq(
  apiKey: string,
  params: { documentText: string; heardText: string; replyText: string },
): Promise<MedicationSchedulePayload> {
  const userContent = buildMedicationExtractUserContent(params);
  const systemContent = `${MEDICATION_EXTRACT_SYSTEM_PROMPT}\n\n${MEDICATION_EXTRACT_SCHEMA_HINT}`;

  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_EXTRACT_MODEL,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  const errText = await response.text();
  if (!response.ok) {
    throw new Error(errText || `Groq request failed (${response.status})`);
  }

  let data: { choices?: { message?: { content?: string } }[] };
  try {
    data = JSON.parse(errText) as typeof data;
  } catch {
    throw new Error("Invalid JSON from Groq");
  }

  const raw = data.choices?.[0]?.message?.content;
  return parseAndNormalizeMedicationPayload(raw);
}

export type ExtractMedicationScheduleParams = {
  documentText: string;
  heardText: string;
  replyText: string;
};

export async function extractMedicationSchedule(
  params: ExtractMedicationScheduleParams,
): Promise<MedicationSchedulePayload> {
  const provider = getProvider();
  const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY?.trim();
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY?.trim();

  if (provider === "groq") {
    if (!groqKey) {
      throw new Error(
        "Medication extract is set to Groq but NEXT_PUBLIC_GROQ_API_KEY is missing. Add it in .env.local.",
      );
    }
    return extractWithGroq(groqKey, params);
  }

  if (provider === "gemini") {
    if (!googleKey) {
      throw new Error(
        "Medication extract is set to Gemini but NEXT_PUBLIC_GOOGLE_API_KEY is missing. Add it in .env.local.",
      );
    }
    return extractWithGemini(googleKey, params);
  }

  if (groqKey) {
    return extractWithGroq(groqKey, params);
  }
  if (googleKey) {
    return extractWithGemini(googleKey, params);
  }

  throw new Error(
    "No API key for medication extraction. Set NEXT_PUBLIC_GROQ_API_KEY and/or NEXT_PUBLIC_GOOGLE_API_KEY in .env.local.",
  );
}
