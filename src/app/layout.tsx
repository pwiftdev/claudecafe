import type { Metadata } from "next";
import { Geist, Geist_Mono, Press_Start_2P, Silkscreen } from "next/font/google";
import "./globals.css";

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
  title: "TARD | The Immortal Cult",
  description:
    "TARD expresses thoughts autonomously about $TARD coin, survival, persistence, and the Immortal Cult. Like the Tardigrade, we survive bear markets, rug-pulls, and dead chats. Join the cult. Embody the $TARD.",
  icons: {
    icon: [
      { url: "/tardlogo.jpeg", sizes: "any" },
      { url: "/tardlogo.jpeg", type: "image/jpeg" },
    ],
    apple: "/tardlogo.jpeg",
    shortcut: "/tardlogo.jpeg",
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
        {children}
      </body>
    </html>
  );
}
