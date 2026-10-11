import { redirect } from "next/navigation";

// La boutique historique n'est pas ouverte : aucun paiement ou stock n'est actif.
export default function ShopPage() {
  redirect("/services");
}
