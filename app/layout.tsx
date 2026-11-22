import type { Metadata, Viewport } from "next";
import { Fredoka, DM_Sans } from "next/font/google";
import { AmbientAudio } from "@/components/AmbientAudio";
import "./globals.css";

const display = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display", // keep whatever variable name your file already uses
});

const body = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body", // keep your existing variable name
});

const site = "https://212222040077-hwa-hackathon.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: "Cadence — Self-Winding Treat Roller",
  description:
    "A self-winding treat roller that turns a dog's play into a slow, rewarding ritual. A design concept, shown as an interactive 3D experience.",
  keywords: ["dog toy", "treat roller", "enrichment", "self-winding", "design concept"],
  openGraph: {
    title: "Cadence — Self-Winding Treat Roller",
    description:
      "A little roll. A little play. A rewarding surprise. A design concept for a self-winding dog treat roller.",
    url: site,
    siteName: "Cadence",
    type: "website",
    images: [
      {
        url: "/assets/plates/poster-large.webp",
        width: 1600,
        height: 900,
        alt: "Concept render of the Cadence self-winding treat roller with a golden retriever",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cadence — Self-Winding Treat Roller",
    description: "A little roll. A little play. A rewarding surprise.",
    images: ["/assets/plates/poster-large.webp"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f1e6",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {children}
        <AmbientAudio />
      </body>
    </html>
  );
}
