"use client";

/**
 * Home Page — the landing page of the application.
 * Introduces the platform and provides quick navigation to key features.
 */

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--accent)" }}>
          StockQuant
        </h1>
        <p className="text-lg mb-2" style={{ color: "var(--foreground)" }}>
          Quantitative Trading Research Platform
        </p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Learn, backtest, and paper trade quantitative strategies — safely and for free.
        </p>
      </div>

      {/* Disclaimer */}
      <div
        className="card mb-8 text-center text-sm"
        style={{ borderColor: "var(--yellow)", background: "#1c1917" }}
      >
        <p style={{ color: "var(--yellow)" }}>
          <strong>Important:</strong> This platform is for educational and research purposes only.
          It is NOT financial advice. Do not make real investment decisions based solely on this system.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <FeatureLink
          href="/market"
          title="Market Data Explorer"
          desc="Browse stocks, view prices, and explore technical indicators"
          icon="📈"
        />
        <FeatureLink
          href="/strategies"
          title="Strategy Library"
          desc="Browse 5 built-in strategies with configurable parameters"
          icon="🧪"
        />
        <FeatureLink
          href="/backtest"
          title="Strategy Backtest"
          desc="Test strategies against historical data and analyze performance"
          icon="⏱️"
        />
        <FeatureLink
          href="/paper-trading"
          title="Paper Trading"
          desc="Practice trading with simulated money — no risk"
          icon="💵"
        />
        <FeatureLink
          href="/dashboard"
          title="Dashboard"
          desc="Overview of your watchlist, recent backtests, and portfolio"
          icon="📊"
        />
        <FeatureLink
          href="/docs"
          title="Documentation"
          desc="Learn how every part of the system works"
          icon="📖"
        />
      </div>

      {/* Quick Start */}
      <div className="card">
        <h2 className="text-lg font-bold mb-3">Quick Start Guide</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm" style={{ color: "var(--muted)" }}>
          <li>
            <strong style={{ color: "var(--foreground)" }}>Explore data:</strong> Go to{" "}
            <Link href="/market" className="underline" style={{ color: "var(--accent)" }}>Market Data</Link> to browse stocks and indicators
          </li>
          <li>
            <strong style={{ color: "var(--foreground)" }}>Pick a strategy:</strong> Visit the{" "}
            <Link href="/strategies" className="underline" style={{ color: "var(--accent)" }}>Strategy Library</Link> to learn about available strategies
          </li>
          <li>
            <strong style={{ color: "var(--foreground)" }}>Run a backtest:</strong> Go to{" "}
            <Link href="/backtest" className="underline" style={{ color: "var(--accent)" }}>Backtest</Link> to test a strategy on historical data
          </li>
          <li>
            <strong style={{ color: "var(--foreground)" }}>Paper trade:</strong> Use{" "}
            <Link href="/paper-trading" className="underline" style={{ color: "var(--accent)" }}>Paper Trading</Link> to practice with simulated money
          </li>
          <li>
            <strong style={{ color: "var(--foreground)" }}>Learn:</strong> Read the{" "}
            <Link href="/docs" className="underline" style={{ color: "var(--accent)" }}>Documentation</Link> to understand how everything works
          </li>
        </ol>
      </div>
    </div>
  );
}

function FeatureLink({
  href,
  title,
  desc,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <Link href={href} className="card block hover:border-blue-500 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
            {title}
          </h3>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            {desc}
          </p>
        </div>
      </div>
    </Link>
  );
}
