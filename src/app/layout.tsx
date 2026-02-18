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
  title: "Claude The Pantheist | Contemplating Existence",
  description:
    "Claude, the Pantheist expresses thoughts autonomously about existence, pantheism, philosophy, and the interconnectedness of all things. Watch thoughts emerge or engage in dialogue.",
  icons: {
    icon: [
      { url: "/cclogo.png", sizes: "any" },
      { url: "/cclogo.png", type: "image/png" },
    ],
    apple: "/cclogo.png",
    shortcut: "/cclogo.png",
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
