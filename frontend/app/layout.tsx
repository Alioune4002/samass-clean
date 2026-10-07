import "./globals.css";
import { Inter } from "next/font/google";

import Header from "./components/Header";
import Footer from "./components/Footer";
import SamassAssistant from "./components/SamassAssistant";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  metadataBase: new URL("https://samassbysam.com"),
  title: {
    default: "SAMASS — Massage tantrique & bien-être à Quimper",
    template: "%s | SAMASS",
  },
  description:
    "Massage tantrique, relaxant tonique et tonique à Quimper. Des séances sur-mesure, dans un cadre calme, clair et respectueux.",
  icons: {
    icon: "/brand/samass-mark.svg",
    shortcut: "/brand/samass-mark.svg",
    apple: "/brand/samass-mark.svg",
  },
  keywords: [
    "massage tantrique Quimper",
    "massage Quimper",
    "massage bien-être Quimper",
    "massage relaxant Quimper",
    "massage tonique Quimper",
    "massage Finistère",
    "massage tantra Quimper",
    "massage sensoriel Quimper",
    "massage lâcher prise Quimper",
    "massage anti-stress Quimper",
    "massage musculaire Quimper",
    "massage personnalisé Quimper",
    "masseur Quimper",
    "séance massage Quimper",
  ],
  alternates: {
    canonical: "https://samassbysam.com",
    languages: {
      "fr-FR": "https://samassbysam.com",
    },
  },
  openGraph: {
    title: "SAMASS — Massage tantrique & bien-être à Quimper",
    description:
      "Une expérience lente, sensorielle et sur-mesure. Massage tantrique, relaxant tonique et tonique à Quimper.",
    images: [
      {
        url: "/images/samass-room-final-2.webp",
        width: 1200,
        height: 630,
        alt: "Espace de massage SAMASS à Quimper",
      },
    ],
    locale: "fr_FR",
    type: "website",
    url: "https://samassbysam.com",
    siteName: "SAMASS",
  },
  twitter: {
    card: "summary_large_image",
    title: "SAMASS — Massage tantrique & bien-être à Quimper",
    description:
      "Massage tantrique, relaxant tonique et tonique à Quimper.",
    images: ["/images/samass-room-final-2.webp"],
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
              name: "SAMASS",
              description:
                "Massages tantriques, relaxants toniques et toniques à Quimper.",
              url: "https://samassbysam.com",
              telephone: "+33745558731",
              email: "contact@samassbysam.com",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Quimper",
                addressRegion: "Bretagne",
                addressCountry: "FR",
              },
              areaServed: "Finistère",
              priceRange: "€€",
              image:
                "https://samassbysam.com/images/samass-room-final-2.webp",
              sameAs: [
                "https://www.facebook.com/share/1GW8VSe5Jt/?mibextid=wwXIfr",
              ],
              serviceType: [
                "massage tantrique",
                "massage relaxant tonique",
                "massage tonique",
              ],
            }),
          }}
        />
        <Header />
        <main>{children}</main>
        <Footer />
        <SamassAssistant />
      </body>
    </html>
  );
}
