"use client";

/**
 * Sidebar Navigation Component.
 *
 * This is the main navigation panel on the left side of every page.
 * It provides links to all major sections of the application.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/market", label: "Market Data", icon: "📈" },
  { href: "/strategies", label: "Strategies", icon: "🧪" },
  { href: "/backtest", label: "Backtest", icon: "⏱️" },
  { href: "/paper-trading", label: "Paper Trading", icon: "💵" },
  { href: "/portfolio", label: "Portfolio", icon: "💼" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/docs", label: "Documentation", icon: "📖" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-full w-56 flex flex-col border-r"
      style={{
        background: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
      }}
    >
      {/* Logo / Brand */}
      <div className="p-4 border-b" style={{ borderColor: "var(--card-border)" }}>
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold" style={{ color: "var(--accent)" }}>
            StockQuant
          </span>
        </Link>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          Quant Research Platform
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style={{
                background: isActive ? "var(--card-bg)" : "transparent",
                color: isActive ? "var(--accent)" : "var(--muted)",
                borderRight: isActive ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Disclaimer Footer */}
      <div
        className="p-3 text-xs border-t"
        style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}
      >
        <p className="font-semibold" style={{ color: "var(--yellow)" }}>
          For Education Only
        </p>
        <p className="mt-1">Not financial advice. Use at your own risk.</p>
      </div>
    </aside>
  );
}
