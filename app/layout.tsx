import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Military Tycoon",
  description: "A playable 3D military tycoon with movement, shop pads, castle defense, and automatic troop battles."
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
