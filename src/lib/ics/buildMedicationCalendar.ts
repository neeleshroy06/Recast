import { slotToTime } from "@/lib/medications/formatMedicationReminder";
import type { MedicationEntry, MedicationReminder } from "@/lib/medications/types";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function escapeIcsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function formatUtcDate(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}` +
    `T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  );
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function nextOccurrenceUtc(base: Date, hour: number, minute: number): Date {
  const t = new Date(base.getTime());
  t.setUTCHours(hour, minute, 0, 0);
  if (t.getTime() <= base.getTime()) {
    return addDays(t, 1);
  }
  return t;
}

function weekdayRule(recurrence: MedicationReminder["recurrence"]): string {
  if (recurrence === "weekdays") {
    return "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR";
  }
  if (recurrence === "weekly") {
    return "FREQ=WEEKLY";
  }
  return "FREQ=DAILY";
}

export function buildMedicationCalendarIcs(medications: MedicationEntry[]): string {
  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Recast//Medication reminders//EN",
    "CALSCALE:GREGORIAN",
  ];

  let uidSeq = 0;
  for (const med of medications) {
    for (const rem of med.reminders) {
      uidSeq += 1;
      const { hour, minute } = slotToTime(rem);
      const start = nextOccurrenceUtc(now, hour, minute);
      const dtStamp = formatUtcDate(now);
      const dtStart = formatUtcDate(start);
      const summary = `${med.name}${med.dosage ? ` (${med.dosage})` : ""}`;
      const desc = [med.instructions, `Slot: ${rem.slot}`, `Recurrence: ${rem.recurrence}`]
        .filter(Boolean)
        .join(" — ");
      const uid = `med-${uidSeq}-${start.getTime()}@recast.local`;
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${dtStamp}`);
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`SUMMARY:${escapeIcsText(summary)}`);
      lines.push(`DESCRIPTION:${escapeIcsText(desc)}`);
      lines.push(`RRULE:${weekdayRule(rem.recurrence)}`);
      lines.push("END:VEVENT");
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
