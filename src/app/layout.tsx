import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "AapkiSociety — The Operating System for Housing Societies",
  description: "Automated GST maintenance billing, 1-click Tally Prime export, smart gate passes and SLA helpdesk for Indian RWAs, CHSs and AOAs. DPDP Act 2023 compliant, hosted in India.",
  keywords: "society management, cooperative housing, maintenance billing, visitor management, Tally Prime export, RWA software India",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" className={`${inter.variable} ${fraunces.variable} h-full antialiased light`} suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#f0f4ff] dark:bg-slate-900 transition-colors">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
