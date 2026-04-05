import { GoogleGenAI } from "@google/genai";
import type { CriticalActionsPayload } from "@/lib/criticalActions/types";
import {
  CRITICAL_ACTIONS_SCHEMA_HINT,
  CRITICAL_ACTIONS_SYSTEM_PROMPT,
  buildCriticalActionsFullPrompt,
  buildCriticalActionsUserContent,
  parseAndNormalizeCriticalActionsPayload,
} from "@/lib/criticalActions/parseCriticalActionsPayload";

const GEMINI_EXTRACT_MODEL = "gemini-2.0-flash";
const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_EXTRACT_MODEL = "llama-3.3-70b-versatile";

type ExtractProvider = "auto" | "groq" | "gemini";

function getProvider(): ExtractProvider {
  const v = process.env.NEXT_PUBLIC_MEDICATION_EXTRACT_PROVIDER?.trim().toLowerCase();
  if (v === "groq" || v === "gemini") return v;
  return "auto";
}

export function canExtractCriticalActions(): boolean {
  const provider = getProvider();
  const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY?.trim();
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY?.trim();
  if (provider === "groq") return Boolean(groqKey);
  if (provider === "gemini") return Boolean(googleKey);
  return Boolean(groqKey || googleKey);
}

async function extractWithGemini(apiKey: string, documentText: string): Promise<CriticalActionsPayload> {
  const ai = new GoogleGenAI({ apiKey });
  const contents = buildCriticalActionsFullPrompt(documentText);
  const response = await ai.models.generateContent({
    model: GEMINI_EXTRACT_MODEL,
    contents,
    config: {
      responseMimeType: "application/json",
    },
  });
  return parseAndNormalizeCriticalActionsPayload(response.text);
}

async function extractWithGroq(apiKey: string, documentText: string): Promise<CriticalActionsPayload> {
  const userContent = buildCriticalActionsUserContent(documentText);
  const systemContent = `${CRITICAL_ACTIONS_SYSTEM_PROMPT}\n\n${CRITICAL_ACTIONS_SCHEMA_HINT}`;

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
  return parseAndNormalizeCriticalActionsPayload(raw);
}

export async function extractCriticalActions(documentText: string): Promise<CriticalActionsPayload> {
  const provider = getProvider();
  const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY?.trim();
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY?.trim();

  if (provider === "groq") {
    if (!groqKey) {
      throw new Error(
        "Extraction is set to Groq but NEXT_PUBLIC_GROQ_API_KEY is missing. Add it in .env.local.",
      );
    }
    return extractWithGroq(groqKey, documentText);
  }

  if (provider === "gemini") {
    if (!googleKey) {
      throw new Error(
        "Extraction is set to Gemini but NEXT_PUBLIC_GOOGLE_API_KEY is missing. Add it in .env.local.",
      );
    }
    return extractWithGemini(googleKey, documentText);
  }

  if (groqKey) {
    return extractWithGroq(groqKey, documentText);
  }
  if (googleKey) {
    return extractWithGemini(googleKey, documentText);
  }

  throw new Error(
    "No API key for extraction. Set NEXT_PUBLIC_GROQ_API_KEY and/or NEXT_PUBLIC_GOOGLE_API_KEY in .env.local.",
  );
}
