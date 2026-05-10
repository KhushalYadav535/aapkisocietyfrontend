import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AapkiSociety — Smart Society Management Platform",
  description: "AI-powered housing society management for cooperative housing societies across India. Billing, complaints, visitor management and more.",
  keywords: "society management, cooperative housing, maintenance billing, India",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased light`} suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#f0f4ff] dark:bg-slate-900 transition-colors">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
