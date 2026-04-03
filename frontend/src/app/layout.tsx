"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { useState } from "react";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import DisclaimerBanner from "@/components/DisclaimerBanner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <title>StockQuant — Quantitative Trading Research Platform</title>
        <meta name="description" content="A beginner-friendly quantitative trading research platform. Not financial advice." />
      </head>
      <body>
        <DisclaimerBanner />

        <div className="app-shell">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="main-content">
            {/* Mobile header with hamburger */}
            <div className="mobile-header">
              <button className="hamburger" onClick={() => setSidebarOpen(true)}>
                ☰
              </button>
              <span style={{ fontWeight: 700, color: "var(--accent)" }}>StockQuant</span>
            </div>

            <div className="main-inner">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
