import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demander un rendez-vous",
  description:
    "Demandez votre rendez-vous de massage avec SAMASS à Quimper. Sélectionnez votre prestation et échangez avec Sam pour confirmer le créneau.",
  alternates: { canonical: "https://samassbysam.com/reservation" },
};

export default function ReservationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
