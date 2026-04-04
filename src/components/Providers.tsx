"use client";

import { PdfDocumentProvider } from "@/components/PdfDocumentContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <PdfDocumentProvider>{children}</PdfDocumentProvider>;
}
