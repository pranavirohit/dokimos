import { Inter } from "next/font/google";
import "./verifier-linear.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-verifier-inter",
  display: "swap",
});

export default function VerifierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`verifier-linear min-h-screen ${inter.variable} font-verifier`}
    >
      {children}
    </div>
  );
}
