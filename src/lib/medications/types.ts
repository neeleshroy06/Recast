export type ReminderSlot = "morning" | "afternoon" | "evening" | "night" | "custom";

export type MedicationReminder = {
  slot: ReminderSlot;
  timeHHMM?: string;
  recurrence: "daily" | "weekdays" | "weekly";
  byDay?: string[];
};

export type MedicationEntry = {
  name: string;
  dosage?: string;
  instructions?: string;
  reminders: MedicationReminder[];
};

export type MedicationSchedulePayload = {
  medications: MedicationEntry[];
};
