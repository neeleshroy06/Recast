"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type PdfContextValue = {
  pdfUrl: string | null;
  fileName: string | null;
  setPdfFromFile: (file: File) => void;
  clearPdf: () => void;
};

const PdfDocumentContext = createContext<PdfContextValue | null>(null);

export function PdfDocumentProvider({ children }: { children: React.ReactNode }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  const revokeCurrent = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const setPdfFromFile = useCallback(
    (file: File) => {
      revokeCurrent();
      const url = URL.createObjectURL(file);
      urlRef.current = url;
      setPdfUrl(url);
      setFileName(file.name);
    },
    [revokeCurrent],
  );

  const clearPdf = useCallback(() => {
    revokeCurrent();
    setPdfUrl(null);
    setFileName(null);
  }, [revokeCurrent]);

  const value = useMemo(
    () => ({ pdfUrl, fileName, setPdfFromFile, clearPdf }),
    [pdfUrl, fileName, setPdfFromFile, clearPdf],
  );

  return (
    <PdfDocumentContext.Provider value={value}>{children}</PdfDocumentContext.Provider>
  );
}

export function usePdfDocument() {
  const ctx = useContext(PdfDocumentContext);
  if (!ctx) {
    throw new Error("usePdfDocument must be used within PdfDocumentProvider");
  }
  return ctx;
}
