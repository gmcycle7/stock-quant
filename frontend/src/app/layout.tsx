import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import DisclaimerBanner from "@/components/DisclaimerBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StockQuant — Quantitative Trading Research Platform",
  description:
    "A beginner-friendly quantitative trading research platform for education and paper trading. Not financial advice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DisclaimerBanner />
        <div className="flex flex-1">
          <Sidebar />
          {/* Main content area — offset by sidebar width (14rem = w-56) */}
          <main className="flex-1 ml-56 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
