import "./globals.css";
import { Inter } from "next/font/google";

import Header from "./components/Header";
import Footer from "./components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  metadataBase: new URL("https://samassbysam.com"),
  title: "SAMASS – Massage Quimper",
  description:
    "Massages bien-être, tantrique, tonique et relaxant à Quimper. Présence, douceur et apaisement.",
  icons: {
    icon: "/images/samass-logo.jpeg",
    shortcut: "/images/samass-logo.jpeg",
    apple: "/images/samass-logo.jpeg",
  },
  keywords: [
    "massage Quimper",
    "massage Finistère",
    "massage Bretagne",
    "massage Quimper centre",
    "masseur Quimper",
    "masseur Finistère",
    "massage bien-être Quimper",
    "massage tantrique Quimper",
    "massage relaxant Quimper",
    "massage tonique Quimper",
    "massage énergétique Quimper",
    "massage détente Quimper",
    "massage corps entier Quimper",
    "massage anti-stress Quimper",
    "massage pour tension musculaire",
    "massage pour anxiété Quimper",
    "massage pour relaxation profonde",
    "massage pour lâcher prise Quimper",
    "massage pour fatigue nerveuse",
    "où faire un massage à Quimper",
    "meilleur masseur Quimper",
    "massage homme à Quimper",
    "massage professionnel Quimper",
    "massage personnalisé Quimper",
    "massage à domicile Quimper",
    "tarifs massage Quimper",
    "réserver massage Quimper",
    "massage tantra Quimper",
    "massage tantrique homme Quimper",
    "massage tantrique bien-être",
    "massage tantrique professionnel",
    "reconnexion corps esprit Quimper",
    "massage sportif Quimper",
    "massage musculaire Quimper",
    "massage décontractant Finistère",
    "massage apaisant Quimper",
    "massage détente profonde Quimper",
    "masseur bien-être",
    "praticien massage Quimper",
    "séance de massage Quimper",
    "soins bien-être Quimper",
  ],
  alternates: {
    canonical: "https://samassbysam.com",
    languages: {
      "fr-FR": "https://samassbysam.com",
    },
  },
  openGraph: {
    title: "SAMASS – Massages à Quimper",
    description:
      "Massage tantrique, tonique et relaxant à Quimper. Offrez-vous un vrai moment de détente.",
    images: ["/images/samass-logo.jpeg"],
    locale: "fr_FR",
    type: "website",
    url: "https://samassbysam.com",
    siteName: "SAMASS Massage",
  },
  twitter: {
    card: "summary_large_image",
    title: "SAMASS – Massages à Quimper",
    description:
      "Massage tantrique, tonique et relaxant à Quimper. Offrez-vous un vrai moment de détente.",
    images: ["/images/samass-logo.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} bg-white text-ink`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "SAMASS Massage",
              description:
                "Massages bien-être, relaxants, toniques et tantriques à Quimper (Finistère).",
              url: "https://samassbysam.com",
              telephone: "+33745558731",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Quimper",
                addressRegion: "Bretagne",
                addressCountry: "FR",
              },
              areaServed: "Finistère",
              priceRange: "€€",
              image: "https://samassbysam.com/images/about1.jpg",
              sameAs: [
                "https://www.facebook.com/share/1GW8VSe5Jt/?mibextid=wwXIfr",
              ],
              serviceType: [
                "massage relaxant",
                "massage tonique",
                "massage tantrique",
              ],
            }),
          }}
        />
        <Header />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
