import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

// Titres : sans-serif géométrique rétro-futuriste ; corps : sans-serif neutre.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-title",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // TODO: remplacer par le vrai nom / la vraie description
  title: "[PRÉNOM NOM] — Chef de Projet IT · Product Owner IA",
  description:
    "Portfolio de [PRÉNOM NOM], Chef de Projet IT et Product Owner IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
