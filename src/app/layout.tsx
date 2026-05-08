import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { LocaleProvider } from "@/context/LocaleContext";

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
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#f0f4ff]">
        <AuthProvider>
          <LocaleProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  borderRadius: "14px",
                  background: "#0f172a",
                  color: "#f8fafc",
                  fontSize: "13px",
                  fontWeight: "500",
                  padding: "12px 16px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
                },
                success: {
                  iconTheme: { primary: "#10b981", secondary: "#fff" },
                },
                error: {
                  iconTheme: { primary: "#ef4444", secondary: "#fff" },
                },
              }}
            />
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
