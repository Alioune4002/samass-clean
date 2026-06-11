// 
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-forest text-white mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">
        
        
        <div>
          <h3 className="text-xl font-semibold mb-4">SAMASS 🌿</h3>
          <p className="text-softgray text-sm">
            Massages bien-être à Quimper. Douceur, présence et écoute pour
            accompagner vos besoins du moment.
          </p>
        </div>

       
        <div>
          <h4 className="font-semibold mb-4">Navigation</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/">Accueil</Link></li>
            <li><Link href="/services">Services</Link></li>
            <li><Link href="/about">À Propos</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>

        
        <div>
          <h4 className="font-semibold mb-4">Coordonnées</h4>
          <p className="text-sm">Quimper, Finistère</p>
          <p className="text-sm">Email : samassbysam@gmail.com</p>
          <p className="text-sm">Téléphone : 07 45 55 87 31</p>
        </div>

      </div>

      <div className="text-center text-xs text-softgray py-4">
        © {new Date().getFullYear()} SAMASS by Sam - Tous droits réservés.
      </div>
    </footer>
  );
}
