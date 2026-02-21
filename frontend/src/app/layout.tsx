import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mission Enigma | Cyber Investigation",
  description: "An immersive cyber-thriller investigation game. Solve puzzles, decode messages, and uncover the truth.",
  keywords: ["puzzle game", "investigation", "cyber thriller", "escape room"],
};

import { Orbitron, JetBrains_Mono, Space_Grotesk, Share_Tech_Mono } from "next/font/google";

const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const digital = Share_Tech_Mono({ weight: '400', subsets: ["latin"], variable: "--font-digital" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${orbitron.variable} ${jetbrains.variable} ${space.variable} ${digital.variable}`}>
      <body className="scanlines bg-grid min-h-screen">
        {children}
      </body>
    </html>
  );
}
