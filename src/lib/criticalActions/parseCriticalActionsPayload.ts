import type { CriticalActionsPayload } from "@/lib/criticalActions/types";

export const CRITICAL_ACTIONS_SYSTEM_PROMPT = `You extract critical action steps from document text. These are concrete things the reader should DO — appointments to schedule, forms to submit, medications to refill, labs to get, follow-up visits, deadlines, warnings that imply an action, or next steps from care plans.
Rules:
- Short imperative phrases (under 120 characters each).
- Order by urgency or document order when possible.
- Include at most 8 steps; fewer if the document does not support more.
- Do not invent steps not grounded in the document.
- If there are no clear actionable steps, return an empty list.
- Output valid JSON only, no markdown fences.`;

export const CRITICAL_ACTIONS_SCHEMA_HINT = `Return JSON with this exact shape:
{
  "steps": ["string", ...]
}
If nothing applies, return {"steps":[]}.`;

export function buildCriticalActionsUserContent(documentText: string): string {
  const doc = documentText.trim().slice(0, 96_000);
  return `DOCUMENT TEXT (may be truncated):\n${doc || "(none)"}\n`;
}

export function buildCriticalActionsFullPrompt(documentText: string): string {
  const user = buildCriticalActionsUserContent(documentText);
  return `${CRITICAL_ACTIONS_SYSTEM_PROMPT}\n\n${CRITICAL_ACTIONS_SCHEMA_HINT}\n\n${user}`;
}

export function parseAndNormalizeCriticalActionsPayload(
  rawText: string | null | undefined,
): CriticalActionsPayload {
  const raw = rawText?.trim();
  if (!raw) {
    return { steps: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const fence = raw.match(/\{[\s\S]*\}/);
    if (fence) {
      try {
        parsed = JSON.parse(fence[0]);
      } catch {
        return { steps: [] };
      }
    } else {
      return { steps: [] };
    }
  }

  if (!parsed || typeof parsed !== "object") {
    return { steps: [] };
  }

  const stepsRaw = (parsed as { steps?: unknown }).steps;
  if (!Array.isArray(stepsRaw)) {
    return { steps: [] };
  }

  const steps: string[] = [];
  for (const item of stepsRaw) {
    if (typeof item !== "string") continue;
    const s = item.trim();
    if (s) steps.push(s.slice(0, 500));
  }

  return { steps: steps.slice(0, 8) };
}
