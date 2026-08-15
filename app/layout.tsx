import type { Metadata, Viewport } from "next";
import { Fredoka, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import "./v2.css";

const fredoka = Fredoka({ variable: "--font-display", subsets: ["latin"] });
const plexSans = IBM_Plex_Sans({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "ESSOR — Reprendre le contrôle",
  description: "Un compagnon pour reprendre le contrôle d’une dépendance, d’une compulsion ou d’une habitude, un jour après l’autre.",
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
