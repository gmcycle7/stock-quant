"use client";

import Link from "next/link";

const FEATURES = [
  { href: "/market", title: "Market Data Explorer", desc: "Browse stocks, view prices, and explore technical indicators", icon: "📈" },
  { href: "/strategies", title: "Strategy Library", desc: "Browse 5 built-in strategies with configurable parameters", icon: "🧪" },
  { href: "/backtest", title: "Strategy Backtest", desc: "Test strategies against historical data and analyze performance", icon: "⏱️" },
  { href: "/paper-trading", title: "Paper Trading", desc: "Practice trading with simulated money — no risk", icon: "💵" },
  { href: "/dashboard", title: "Dashboard", desc: "Overview of your watchlist, recent backtests, and portfolio", icon: "📊" },
  { href: "/docs", title: "Documentation", desc: "Learn how every part of the system works", icon: "📖" },
];

export default function HomePage() {
  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "3rem 0 2rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--accent)", marginBottom: ".5rem" }}>
          StockQuant
        </h1>
        <p style={{ fontSize: "1.1rem", marginBottom: ".25rem" }}>
          Quantitative Trading Research Platform
        </p>
        <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>
          Learn, backtest, and paper trade quantitative strategies — safely and for free.
        </p>
      </div>

      {/* Risk warning */}
      <div className="card" style={{ borderColor: "var(--yellow)", background: "#1c1917", textAlign: "center", marginBottom: "2rem" }}>
        <p style={{ color: "var(--yellow)", fontSize: ".85rem" }}>
          <strong>Important:</strong> This platform is for educational and research purposes only.
          It is NOT financial advice. Do not make real investment decisions based solely on this system.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid-2" style={{ marginBottom: "2rem" }}>
        {FEATURES.map((f) => (
          <Link key={f.href} href={f.href} className="card" style={{ display: "block", textDecoration: "none", color: "inherit", transition: "border-color .15s" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: ".75rem" }}>
              <span style={{ fontSize: "1.5rem" }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: ".25rem" }}>{f.title}</div>
                <div style={{ fontSize: ".8rem", color: "var(--muted)" }}>{f.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Start */}
      <div className="card">
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: ".75rem" }}>Quick Start Guide</h2>
        <ol style={{ paddingLeft: "1.25rem", fontSize: ".85rem", color: "var(--muted)", lineHeight: 2 }}>
          <li><strong style={{ color: "var(--foreground)" }}>Explore data:</strong> Go to <Link href="/market" style={{ color: "var(--accent)" }}>Market Data</Link></li>
          <li><strong style={{ color: "var(--foreground)" }}>Pick a strategy:</strong> Visit the <Link href="/strategies" style={{ color: "var(--accent)" }}>Strategy Library</Link></li>
          <li><strong style={{ color: "var(--foreground)" }}>Run a backtest:</strong> Go to <Link href="/backtest" style={{ color: "var(--accent)" }}>Backtest</Link></li>
          <li><strong style={{ color: "var(--foreground)" }}>Paper trade:</strong> Use <Link href="/paper-trading" style={{ color: "var(--accent)" }}>Paper Trading</Link></li>
          <li><strong style={{ color: "var(--foreground)" }}>Learn:</strong> Read the <Link href="/docs" style={{ color: "var(--accent)" }}>Documentation</Link></li>
        </ol>
      </div>
    </div>
  );
}
