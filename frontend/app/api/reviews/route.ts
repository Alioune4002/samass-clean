import { NextResponse } from "next/server";
import { createPublicReview, getPublishedReviews } from "@/lib/server/reviewsStore";
export const runtime = "nodejs";
export async function GET() {
  try {
    const reviews = await getPublishedReviews();
    return NextResponse.json(reviews, { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } });
  } catch (error) {
    console.error("SAMASS reviews unavailable", error);
    return NextResponse.json([], { status: 200 });
  }
}
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.website) return NextResponse.json({ received: true });
    return NextResponse.json(await createPublicReview(body), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const validation = [
      "Nom invalide.", "Adresse e-mail invalide.",
      "Choisissez une note entre 1 et 5.",
      "Indiquez la date de votre séance.",
      "La date de séance n'est pas valide.",
      "Votre avis doit contenir entre 20 et 1 400 caractères.",
      "Précisez si vous acceptez la publication de votre avis.",
      "Un avis a déjà été soumis avec cette adresse récemment.",
      "Ce lien d'invitation n'est pas valide.",
      "Cette invitation a expiré ou ne correspond pas à votre adresse email.",
    ];
    if (validation.includes(message)) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("SAMASS review creation failed", error);
    return NextResponse.json(
      { error: "Le formulaire est momentanément indisponible." }, { status: 503 }
    );
  }
}
