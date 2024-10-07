'use client';

import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"

// Load custom fonts and set CSS variables for font styling
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",  // Variable font weight range
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",  // Variable font weight range
});

// RootLayout component defines the structure for the entire app
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Render page content */}
        {children}
        {/* Global toast notifications */}
        <Toaster richColors duration={5000} />
      </body>
    </html>
  );
}
