"use client";

import { ListChecks, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useGeminiLiveDocumentContext } from "@/components/GeminiLiveDocumentProvider";
import {
  canExtractCriticalActions,
  extractCriticalActions,
} from "@/lib/criticalActions/extractCriticalActions";

export function CriticalActionsPanel() {
  const { documentExtractedText } = useGeminiLiveDocumentContext();
  const [steps, setSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastDocHashRef = useRef<string>("");

  useEffect(() => {
    const doc = documentExtractedText.trim();
    if (!doc) {
      lastDocHashRef.current = "";
      setSteps([]);
      setError(null);
      setLoading(false);
      return;
    }

    if (!canExtractCriticalActions()) {
      setSteps([]);
      setError(null);
      setLoading(false);
      return;
    }

    if (doc === lastDocHashRef.current) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSteps([]);

    void extractCriticalActions(doc)
      .then((payload) => {
        if (cancelled) return;
        lastDocHashRef.current = doc;
        setSteps(payload.steps);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setSteps([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [documentExtractedText]);

  const showKeyHint = Boolean(
    documentExtractedText.trim() && !canExtractCriticalActions() && !loading,
  );
  const showPlaceholder =
    !loading &&
    !error &&
    steps.length === 0 &&
    canExtractCriticalActions() &&
    !showKeyHint;

  return (
    <section className="rounded-2xl border border-[var(--recast-border)]/60 bg-[var(--recast-surface-elevated)]/80 p-4 ring-1 ring-[var(--recast-border)]/25">
      <div className="flex items-start gap-2">
        <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-[var(--recast-accent)]" strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--recast-text)]">
            Critical next steps
          </h2>

          {loading ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-[var(--recast-text-muted)]">
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" strokeWidth={2} />
              Reading your document…
            </div>
          ) : null}

          {error ? (
            <p className="mt-2 text-xs leading-relaxed text-red-600 dark:text-red-400">{error}</p>
          ) : null}

          {showKeyHint ? (
            <p className="mt-2 text-xs text-[var(--recast-text-muted)]">
              Add <code className="rounded bg-black/10 px-1">NEXT_PUBLIC_GROQ_API_KEY</code> (or Google key) to
              load steps.
            </p>
          ) : null}

          {!loading && !error && steps.length > 0 ? (
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-relaxed text-[var(--recast-text)]">
              {steps.map((s, i) => (
                <li key={`${i}-${s.slice(0, 24)}`}>{s}</li>
              ))}
            </ol>
          ) : null}

          {showPlaceholder ? (
            <p className="mt-2 text-xs text-[var(--recast-text-muted)]">
              {documentExtractedText.trim()
                ? "No clear action items were found in this document."
                : "Open “Talk about this document” to load text and extract steps."}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
