import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Battle Droids",
  description: "A retro-inspired browser battle game with troop shops, weapon swaps, and upgrade chests."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
