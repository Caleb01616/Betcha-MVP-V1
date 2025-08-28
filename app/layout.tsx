import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Betcha - Skill-Based Gaming & Betting",
  description: "Professional skill-based gaming platform with American-style betting odds. Challenge opponents, join tournaments, and win big with your skills.",
  keywords: "gaming, betting, tournaments, skill-based, esports, competitive",
  authors: [{ name: "Betcha Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "Betcha - Skill-Based Gaming & Betting",
    description: "Professional skill-based gaming platform with American-style betting odds.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Betcha - Skill-Based Gaming & Betting",
    description: "Professional skill-based gaming platform with American-style betting odds.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
