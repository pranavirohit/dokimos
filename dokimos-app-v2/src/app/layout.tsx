import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { DokimosAppProvider } from "@/contexts/DokimosAppContext";

const geistSans = GeistSans;
const geistMono = GeistMono;

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dokimos - Identity Verification Vault",
  description: "Verify once. Share everywhere.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} font-sans antialiased`}
    >
      <body className={`${geistSans.className} font-sans`}>
        <SessionProvider>
          <DokimosAppProvider>{children}</DokimosAppProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
