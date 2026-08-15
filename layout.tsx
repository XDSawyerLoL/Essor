import type { Metadata, Viewport } from "next";
import { Fredoka, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({ variable: "--font-display", subsets: ["latin"] });
const plexSans = IBM_Plex_Sans({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "ESSOR — L’application qui enlève le mauvais sort",
  description: "Transforme chaque effort en victoire visible : ton arbre grandit, tes badges s’allument et ta fierté aussi.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
  other: { "codex-preview": "development" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#15131d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${fredoka.variable} ${plexSans.variable} ${plexMono.variable}`}>{children}</body>
    </html>
  );
}
