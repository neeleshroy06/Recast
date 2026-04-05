import type { PDFDocumentProxy } from "pdfjs-dist";
import { redactPHI, type PhiRedactionResult } from "@/lib/phiRedaction";

const MAX_CHARS = 60_000;

let workerConfigured = false;
const PDF_LOAD_CACHE = new Map<string, Promise<PDFDocumentProxy>>();

export type ExtractedPdfPageText = {
  pageNumber: number;
  text: string;
};

type TextLikeItem = {
  str?: string;
  hasEOL?: boolean;
  transform?: number[];
};

export async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  if (typeof window !== "undefined" && !workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;
    workerConfigured = true;
  }
  return pdfjs;
}

export async function loadPdfFromUrl(pdfUrl: string): Promise<PDFDocumentProxy> {
  if (!PDF_LOAD_CACHE.has(pdfUrl)) {
    PDF_LOAD_CACHE.set(
      pdfUrl,
      (async () => {
        const pdfjs = await loadPdfjs();
        const res = await fetch(pdfUrl);
        const buf = await res.arrayBuffer();
        const task = pdfjs.getDocument({ data: buf });
        return task.promise;
      })(),
    );
  }

  return PDF_LOAD_CACHE.get(pdfUrl)!;
}

function truncatePdfText(text: string): string {
  if (text.length <= MAX_CHARS) return text;
  return (
    text.slice(0, MAX_CHARS) +
    "\n\n[… Document text truncated for the voice session context window …]"
  );
}

function formatPdfText(pages: ExtractedPdfPageText[]): string {
  return pages
    .map(({ pageNumber, text }) => `=== PAGE ${pageNumber} ===\n${text}`)
    .join("\n\n")
    .trim();
}

function isTextItem(item: unknown): item is TextLikeItem {
  return Boolean(item && typeof item === "object" && "str" in (item as TextLikeItem));
}

function collectPageLines(items: unknown[]): string[] {
  const lines: string[] = [];
  let current = "";
  let currentY: number | null = null;

  const flush = () => {
    const text = current.replace(/\s+/g, " ").trim();
    if (text) {
      lines.push(text);
    }
    current = "";
    currentY = null;
  };

  for (const item of items) {
    if (!isTextItem(item) || !item.str?.trim()) {
      continue;
    }

    const y = typeof item.transform?.[5] === "number" ? Math.round(item.transform[5]) : null;
    const shouldBreak = current && y !== null && currentY !== null && Math.abs(y - currentY) > 2;

    if (shouldBreak) {
      flush();
    }

    current += `${current ? " " : ""}${item.str}`;
    currentY = y ?? currentY;

    if (item.hasEOL) {
      flush();
    }
  }

  flush();
  return lines;
}

export async function extractPdfPageTexts(pdfUrl: string): Promise<ExtractedPdfPageText[]> {
  const pdf = await loadPdfFromUrl(pdfUrl);
  const pages: ExtractedPdfPageText[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = collectPageLines(content.items as unknown[]);
    const text = lines.join("\n").trim();
    pages.push({ pageNumber, text });
  }

  return pages;
}

/** Concatenate text from all pages; truncated to MAX_CHARS. */
export async function extractPdfText(pdfUrl: string): Promise<string> {
  const pages = await extractPdfPageTexts(pdfUrl);
  return truncatePdfText(formatPdfText(pages));
}

export async function extractRedactedPdfText(pdfUrl: string): Promise<PhiRedactionResult> {
  const pages = await extractPdfPageTexts(pdfUrl);
  const fullText = formatPdfText(pages);
  const result = redactPHI(fullText);
  return {
    ...result,
    text: truncatePdfText(result.text),
  };
}

/** Render page 1 to a JPEG data URL's raw base64 payload (no prefix). */
export async function renderFirstPageJpegBase64(
  pdfUrl: string,
  maxWidth = 900,
): Promise<string> {
  const pdf = await loadPdfFromUrl(pdfUrl);
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  const scale = Math.min(1, maxWidth / viewport.width);
  const scaled = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(scaled.width);
  canvas.height = Math.floor(scaled.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  await page.render({ canvasContext: ctx, viewport: scaled, canvas }).promise;

  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  const comma = dataUrl.indexOf(",");
  if (comma === -1) throw new Error("Invalid JPEG data URL");
  return dataUrl.slice(comma + 1);
}

export function isWeakTextContent(text: string): boolean {
  const t = text.replace(/===\s*PAGE\s+\d+\s*===/gi, "").replace(/\s+/g, "").trim();
  return t.length < 40;
}
