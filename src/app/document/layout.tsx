import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Document — Recast",
  description: "View your document and explore Recast tools.",
};

export default function DocumentRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
