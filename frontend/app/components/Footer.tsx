import Link from "next/link";

export default function Footer() {
  return (
    <footer className="ritual-footer">
      <div className="ritual-footer-top">
        <div className="ritual-footer-intro">
          <p className="ritual-eyebrow">SAMASS · QUIMPER</p>
          <h2>Un espace pour ralentir, simplement.</h2>
          <p>
            Massages sur-mesure, présence, écoute et rythme adapté à votre
            besoin du moment.
          </p>
        </div>

        <div className="ritual-footer-links">
          <div>
            <small>Explorer</small>
            <Link href="/services">Massages</Link>
            <Link href="/about">L’approche</Link>
            <Link href="/reservation">Rendez-vous</Link>
            <Link href="/contact">Contact</Link>
          </div>

          <div>
            <small>Contact</small>
            <a href="tel:+33745558731">07 45 55 87 31</a>
            <a href="mailto:contact@samassbysam.com">contact@samassbysam.com</a>
            <span>Quimper · Finistère</span>
          </div>
        </div>
      </div>

      <div className="ritual-footer-bottom">
        <span>© {new Date().getFullYear()} SAMASS BY SAM</span>
        <span>Massage bien-être · sur rendez-vous</span>
      </div>
    </footer>
  );
}
