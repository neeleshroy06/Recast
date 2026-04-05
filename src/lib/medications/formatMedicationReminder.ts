import type { MedicationReminder, ReminderSlot } from "@/lib/medications/types";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Clock time used for calendar display and ICS (UTC helpers use this elsewhere). */
export function slotToTime(rem: MedicationReminder): { hour: number; minute: number } {
  if (rem.slot === "custom" && rem.timeHHMM) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(rem.timeHHMM.trim());
    if (m) {
      const hour = Math.min(23, Math.max(0, parseInt(m[1], 10)));
      const minute = Math.min(59, Math.max(0, parseInt(m[2], 10)));
      return { hour, minute };
    }
  }
  switch (rem.slot) {
    case "morning":
      return { hour: 8, minute: 0 };
    case "afternoon":
      return { hour: 13, minute: 0 };
    case "evening":
      return { hour: 18, minute: 0 };
    case "night":
      return { hour: 21, minute: 0 };
    default:
      return { hour: 9, minute: 0 };
  }
}

function formatTime12h(hour: number, minute: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h12}:${pad2(minute)} ${ampm}`;
}

function slotLabel(slot: ReminderSlot): string {
  switch (slot) {
    case "morning":
      return "Morning";
    case "afternoon":
      return "Afternoon";
    case "evening":
      return "Evening";
    case "night":
      return "Night";
    case "custom":
      return "Custom time";
    default:
      return slot;
  }
}

function formatRecurrence(rem: MedicationReminder): string {
  switch (rem.recurrence) {
    case "daily":
      return "Daily";
    case "weekdays":
      return "Weekdays";
    case "weekly": {
      const days = rem.byDay?.length ? rem.byDay.join(", ") : null;
      return days ? `Weekly (${days})` : "Weekly";
    }
    default:
      return rem.recurrence;
  }
}

/** One line per reminder for PDF / plain text. */
export function formatReminderHuman(rem: MedicationReminder): string {
  const { hour, minute } = slotToTime(rem);
  const timePart = formatTime12h(hour, minute);
  return `${timePart} · ${slotLabel(rem.slot)} — ${formatRecurrence(rem)}`;
}

/** All reminders as newline-separated text, or empty string if none. */
export function formatAllRemindersHuman(reminders: MedicationReminder[]): string {
  if (!reminders.length) return "";
  return reminders.map(formatReminderHuman).join("\n");
}
