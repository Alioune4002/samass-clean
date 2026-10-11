import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Massages à Quimper — Prestations et tarifs",
  description:
    "Découvrez les massages bien-être SAMASS à Quimper : tantrique, relaxant tonique et tonique. Des séances personnalisées, sur rendez-vous.",
  alternates: { canonical: "https://samassbysam.com/services" },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
