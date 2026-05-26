import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReadForge — Master Reading Comprehension & MCAT CARS",
  description:
    "AI-powered reading comprehension platform built on Cambridge Learning methodology. Improve speed, comprehension, and dominate MCAT CARS.",
  keywords: ["MCAT CARS", "reading comprehension", "speed reading", "CARS prep"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
