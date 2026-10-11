import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — SAMASS Quimper",
  description:
    "Contactez SAMASS pour vos questions ou votre prochain massage bien-être à Quimper. Échangez directement avec Sam.",
  alternates: { canonical: "https://samassbysam.com/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
