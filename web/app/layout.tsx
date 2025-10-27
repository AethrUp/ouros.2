import type { Metadata, Viewport } from "next";
import { Inter, PT_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ouros - Astrology & Oracle",
  description: "Explore your cosmic path with personalized astrology, tarot readings, and I Ching wisdom",
  keywords: ["astrology", "tarot", "i ching", "oracle", "horoscope", "natal chart"],
  authors: [{ name: "Aethrup" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#81B8B5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${ptSerif.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
