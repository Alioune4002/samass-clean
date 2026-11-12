import type { Metadata } from "next";
import ReviewsClient from "./ReviewsClient";

export const metadata: Metadata = {
  title: "Avis et témoignages clients",
  description: "Partagez votre expérience chez SAMASS à Quimper et consultez les témoignages publiés avec l'accord de leurs auteurs.",
  alternates: { canonical: "https://samassbysam.com/avis" },
};

export default function ReviewsPage() {
  return <ReviewsClient />;
}
