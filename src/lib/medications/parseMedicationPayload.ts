import type {
  MedicationEntry,
  MedicationListRole,
  MedicationSchedulePayload,
  ReminderSlot,
} from "@/lib/medications/types";

const VALID_SLOTS = new Set<ReminderSlot>(["morning", "afternoon", "evening", "night", "custom"]);
const VALID_REC = new Set(["daily", "weekdays", "weekly"]);
const VALID_LIST_ROLES = new Set<MedicationListRole>(["current", "new", "unspecified"]);

export const MEDICATION_EXTRACT_SYSTEM_PROMPT = `You extract structured medication schedules from medical document text and optional chat context.
Rules:
- Only include medications that are clearly prescribed or listed in the document or conversation.
- Set listRole per medication: "current" = patient is already taking / home medications / continued; "new" = newly started, added, or suggested in this visit or note; "unspecified" = unclear.
- For each medication, create one or more reminders using slots: morning, afternoon, evening, night, or custom.
- Map phrases like "once daily in the morning" to one morning reminder (recurrence daily).
- Map "twice daily" to morning + evening (or afternoon + night if clearly stated).
- Map "with meals" to morning + afternoon + evening as appropriate, or morning + evening if twice.
- Map "every morning" / "each morning" → slot morning, recurrence daily.
- Map "weekdays only" → recurrence weekdays.
- Use slot "custom" with timeHHMM (24h HH:mm) only when an exact time is given (e.g. "at 16:30").
- If timing is vague, prefer morning/afternoon/evening/night over custom.
- recurrence must be one of: daily, weekdays, weekly (use weekly with byDay only when specific days are named).
- Output valid JSON only, no markdown fences.`;

export const MEDICATION_EXTRACT_SCHEMA_HINT = `Return JSON with this exact shape:
{
  "medications": [
    {
      "name": "string",
      "dosage": "optional string",
      "instructions": "optional string",
      "listRole": "current" | "new" | "unspecified",
      "reminders": [
        {
          "slot": "morning" | "afternoon" | "evening" | "night" | "custom",
          "timeHHMM": "optional, only for custom, format HH:mm 24h",
          "recurrence": "daily" | "weekdays" | "weekly",
          "byDay": ["MO","TU",...] 
        }
      ]
    }
  ]
}
If no medications are found, return {"medications":[]}.`;

export function buildMedicationExtractUserContent(params: {
  documentText: string;
  heardText: string;
  replyText: string;
}): string {
  const doc = params.documentText.trim().slice(0, 96_000);
  return `DOCUMENT TEXT (may be truncated):\n${doc || "(none)"}\n\nRECENT USER TRANSCRIPT (may be partial):\n${params.heardText.trim() || "(none)"}\n\nRECENT ASSISTANT TRANSCRIPT (may be partial):\n${params.replyText.trim() || "(none)"}\n`;
}

export function buildMedicationExtractFullPrompt(params: {
  documentText: string;
  heardText: string;
  replyText: string;
}): string {
  const user = buildMedicationExtractUserContent(params);
  return `${MEDICATION_EXTRACT_SYSTEM_PROMPT}\n\n${MEDICATION_EXTRACT_SCHEMA_HINT}\n\n${user}`;
}

export function parseAndNormalizeMedicationPayload(rawText: string | null | undefined): MedicationSchedulePayload {
  const raw = rawText?.trim();
  if (!raw) {
    return { medications: [] };
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
        return { medications: [] };
      }
    } else {
      return { medications: [] };
    }
  }

  const root = parsed as { medications?: unknown };
  if (!Array.isArray(root.medications)) {
    return { medications: [] };
  }

  const medications: MedicationEntry[] = [];
  for (const m of root.medications) {
    if (!m || typeof m !== "object") continue;
    const o = m as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.trim() : "";
    if (!name) continue;
    const dosage = typeof o.dosage === "string" ? o.dosage.trim() : undefined;
    const instructions = typeof o.instructions === "string" ? o.instructions.trim() : undefined;
    const lr = o.listRole;
    const listRole: MedicationListRole | undefined =
      typeof lr === "string" && VALID_LIST_ROLES.has(lr as MedicationListRole)
        ? (lr as MedicationListRole)
        : undefined;
    const remindersRaw = o.reminders;
    if (!Array.isArray(remindersRaw)) {
      medications.push({ name, dosage, instructions, listRole, reminders: [] });
      continue;
    }
    const reminders: MedicationEntry["reminders"] = [];
    for (const r of remindersRaw) {
      if (!r || typeof r !== "object") continue;
      const rr = r as Record<string, unknown>;
      const slot = rr.slot;
      const rec = rr.recurrence;
      if (typeof slot !== "string" || !VALID_SLOTS.has(slot as ReminderSlot)) continue;
      if (typeof rec !== "string" || !VALID_REC.has(rec)) continue;
      const timeHHMM = typeof rr.timeHHMM === "string" ? rr.timeHHMM.trim() : undefined;
      const byDay = Array.isArray(rr.byDay)
        ? rr.byDay.filter((d): d is string => typeof d === "string")
        : undefined;
      reminders.push({
        slot: slot as ReminderSlot,
        timeHHMM,
        recurrence: rec as "daily" | "weekdays" | "weekly",
        byDay,
      });
    }
    medications.push({ name, dosage, instructions, listRole, reminders });
  }

  return { medications };
}
