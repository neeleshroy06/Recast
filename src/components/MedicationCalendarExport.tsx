"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { useGeminiLiveDocumentContext } from "@/components/GeminiLiveDocumentProvider";
import { buildMedicationCalendarIcs } from "@/lib/ics/buildMedicationCalendar";
import { buildMedicationListPdfBlob } from "@/lib/medications/buildMedicationListPdf";
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

function downloadBlob(filename: string, blob: Blob) {
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

  const disabled = busy || !hasContext || !canExtractMedicationSchedule();

  const onDownloadPdf = async () => {
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
      if (payload.medications.length === 0) {
        setMessage(
          "No medications were found in the document or chat. Try discussing your prescriptions with the assistant, then export again.",
        );
        return;
      }
      const blob = buildMedicationListPdfBlob(payload.medications);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadBlob(`medications-list-${stamp}.pdf`, blob);
      setMessage(
        "Downloaded medication list (PDF). It includes current and new medications when the document distinguishes them.",
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessage(`Could not generate PDF: ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  const onDownloadIcs = async () => {
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

  const btnClass =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45";

  return (
    <div className="rounded-2xl border border-[var(--recast-border)]/60 bg-[var(--recast-surface-elevated)]/80 p-3 ring-1 ring-[var(--recast-border)]/25">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => void onDownloadPdf()}
          title="Full medication list — PDF (current and new meds)"
          className={`${btnClass} border-[var(--recast-border)]/80 bg-[var(--recast-surface)]/90 text-[var(--recast-text)] hover:bg-[var(--recast-surface-elevated)]`}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" strokeWidth={2} />
          ) : (
            <FileText className="h-4 w-4 shrink-0" strokeWidth={2} />
          )}
          {busy ? "Generating…" : "Download medication list (PDF)"}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void onDownloadIcs()}
          title="Medication reminders — export .ics calendar"
          className={`${btnClass} border-[var(--recast-accent)]/50 bg-[var(--recast-accent)]/10 text-[var(--recast-accent)] hover:bg-[var(--recast-accent)]/20`}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" strokeWidth={2} />
          ) : (
            <Download className="h-4 w-4 shrink-0" strokeWidth={2} />
          )}
          {busy ? "Generating…" : "Download medication calendar (.ics)"}
        </button>
      </div>
      {message ? (
        <p className="mt-2 text-xs leading-relaxed text-[var(--recast-text-muted)]">{message}</p>
      ) : null}
    </div>
  );
}
