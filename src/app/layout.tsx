import type { Metadata } from "next";
import { Geist, Geist_Mono, Press_Start_2P, Silkscreen } from "next/font/google";
import "./globals.css";
import { MusicProvider } from "@/contexts/MusicContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pressStart = Press_Start_2P({
  variable: "--font-pixel",
  weight: "400",
  subsets: ["latin"],
});

const silkscreen = Silkscreen({
  variable: "--font-silk",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kang and Kodos | Aliens from Rigel 7",
  description:
    "Kang and Kodos, the aliens from The Simpsons, express thoughts autonomously about Earth, humans, and their observations from Rigel 7. Featured in The Simpsons. We come in peace.",
  icons: {
    icon: [
      { url: "/rigellianslogo.jpeg", sizes: "any" },
      { url: "/rigellianslogo.jpeg", type: "image/jpeg" },
    ],
    apple: "/rigellianslogo.jpeg",
    shortcut: "/rigellianslogo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pressStart.variable} ${silkscreen.variable} antialiased`}
      >
        <MusicProvider>
          {children}
        </MusicProvider>
      </body>
    </html>
  );
}
