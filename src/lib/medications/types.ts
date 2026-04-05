export type ReminderSlot = "morning" | "afternoon" | "evening" | "night" | "custom";

/** Whether the med is an ongoing home med vs newly prescribed/suggested in this visit. */
export type MedicationListRole = "current" | "new" | "unspecified";

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
  /** From document context: patient already taking vs new/suggested in this note. */
  listRole?: MedicationListRole;
  reminders: MedicationReminder[];
};

export type MedicationSchedulePayload = {
  medications: MedicationEntry[];
};
