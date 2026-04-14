import type { Metadata } from "next";
import { Courier_Prime } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";

const courierPrime = Courier_Prime({
  weight: ['400', '700'],
  subsets: ["latin"],
  variable: "--font-courier",
});

export const metadata: Metadata = {
  title: "Crypto Portfolio Tracker",
  description: "Track your cryptocurrency portfolio in real-time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={courierPrime.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-black text-white antialiased" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
