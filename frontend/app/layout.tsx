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
  title: {
    default: "SAMASS – Massage & Relaxation à Quimper",
    template: "%s | SAMASS Massage Quimper",
  },
  description:
    "Massages bien-être, relaxation, toniques et tantriques à Quimper (Finistère). Présence, douceur et écoute pour des séances sur-mesure.",
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
    type: "website",
    url: "https://samassbysam.com",
    title: "SAMASS – Massage à Quimper",
    description:
      "Massages relaxants, toniques et tantriques sur-mesure à Quimper et dans le Finistère.",
    siteName: "SAMASS Massage",
    images: [
      {
        url: "https://samassbysam.com/images/about1.jpg",
        width: 1200,
        height: 630,
        alt: "Cabinet de massage SAMASS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SAMASS – Massage à Quimper",
    description:
      "Massages relaxants, toniques et tantriques sur-mesure à Quimper et dans le Finistère.",
    images: ["https://samassbysam.com/images/about1.jpg"],
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
