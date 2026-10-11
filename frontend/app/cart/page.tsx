import { redirect } from "next/navigation";

// L'ancien panier Stripe n'est pas configuré pour les réservations SAMASS.
export default function CartPage() {
  redirect("/services");
}
