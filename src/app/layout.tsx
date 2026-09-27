import type { Metadata, Viewport } from "next";
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
  title: {
    default: "AapkiSociety — The Operating System for Housing Societies",
    template: "%s · AapkiSociety",
  },
  description: "Automated GST maintenance billing, 1-click Tally Prime export, smart gate passes and SLA helpdesk for Indian RWAs, CHSs and AOAs. DPDP Act 2023 compliant, hosted in India.",
  keywords: "society management, cooperative housing, maintenance billing, visitor management, Tally Prime export, RWA software India, housing society app",
  robots: { index: true, follow: true },
  openGraph: {
    title: "AapkiSociety — The Operating System for Housing Societies",
    description: "Billing, gate, helpdesk and accounts — one calm operating system for Indian housing societies. 30-day free trial.",
    type: "website",
    locale: "en_IN",
    siteName: "AapkiSociety",
  },
  twitter: {
    card: "summary_large_image",
    title: "AapkiSociety — The Operating System for Housing Societies",
    description: "Automated GST billing, smart gate passes, Tally export and SLA helpdesk for RWAs, CHSs and AOAs.",
  },
  appleWebApp: { capable: true, title: "AapkiSociety", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
};

const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AapkiSociety",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, Android, iOS",
  description: "Housing society management platform for Indian RWAs, CHSs and AOAs: GST billing, Tally Prime export, visitor gate passes and SLA helpdesk.",
  offers: { "@type": "Offer", price: "25", priceCurrency: "INR" },
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "500" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" className={`${inter.variable} ${fraunces.variable} h-full antialiased light`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#f0f4ff] dark:bg-slate-900 transition-colors">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
