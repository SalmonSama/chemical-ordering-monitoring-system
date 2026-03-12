import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Load Inter font and expose as CSS variable
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ChemTrack — Lab Inventory & Chemical Ordering",
    template: "%s | ChemTrack",
  },
  description:
    "Production-grade lab inventory, chemical ordering, and peroxide monitoring system for multi-village lab environments.",
  keywords: ["lab inventory", "chemical ordering", "peroxide monitoring", "lab management"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
