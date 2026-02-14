import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mission Enigma | Cyber Investigation",
  description: "An immersive cyber-thriller investigation game. Solve puzzles, decode messages, and uncover the truth.",
  keywords: ["puzzle game", "investigation", "cyber thriller", "escape room"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="scanlines bg-grid min-h-screen">
        {children}
      </body>
    </html>
  );
}
