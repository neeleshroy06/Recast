"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useGeminiLiveDocumentContext } from "@/components/GeminiLiveDocumentProvider";
import { buildMedicationCalendarIcs } from "@/lib/ics/buildMedicationCalendar";
import {
  canExtractMedicationSchedule,
  extractMedicationSchedule,
} from "@/lib/medications/extractMedicationSchedule";

function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function MedicationCalendarExport() {
  const { documentExtractedText, heardText, replyText } = useGeminiLiveDocumentContext();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const hasContext =
    documentExtractedText.trim().length > 0 ||
    heardText.trim().length > 0 ||
    replyText.trim().length > 0;

  const onDownload = async () => {
    if (!canExtractMedicationSchedule()) {
      setMessage(
        "Add NEXT_PUBLIC_GROQ_API_KEY and/or NEXT_PUBLIC_GOOGLE_API_KEY in .env.local (see .env.example). With default provider “auto”, Groq is used if set.",
      );
      return;
    }
    if (!hasContext) {
      setMessage("Start a conversation about your document first so we have text to extract from.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const payload = await extractMedicationSchedule({
        documentText: documentExtractedText,
        heardText,
        replyText,
      });
      const meds = payload.medications.filter((m) => m.reminders.length > 0);
      if (meds.length === 0) {
        setMessage(
          "No medication schedule was found. Try asking Gemini about your prescriptions in chat, then export again.",
        );
        return;
      }
      const ics = buildMedicationCalendarIcs(meds);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadTextFile(`medications-${stamp}.ics`, ics, "text/calendar;charset=utf-8");
      setMessage(
        "Downloaded reminder schedule. Import the file in Google Calendar or Apple Calendar.",
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessage(`Could not generate calendar: ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--recast-border)]/60 bg-[var(--recast-surface-elevated)]/80 p-3 ring-1 ring-[var(--recast-border)]/25">
      <button
        type="button"
        disabled={busy || !hasContext || !canExtractMedicationSchedule()}
        onClick={() => void onDownload()}
        title="Medication reminders — export .ics calendar"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--recast-accent)]/50 bg-[var(--recast-accent)]/10 px-4 py-2.5 text-sm font-medium text-[var(--recast-accent)] transition hover:bg-[var(--recast-accent)]/20 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" strokeWidth={2} />
        ) : (
          <Download className="h-4 w-4 shrink-0" strokeWidth={2} />
        )}
        {busy ? "Generating…" : "Download medication calendar (.ics)"}
      </button>
      {message ? (
        <p className="mt-2 text-xs leading-relaxed text-[var(--recast-text-muted)]">{message}</p>
      ) : null}
    </div>
  );
}
