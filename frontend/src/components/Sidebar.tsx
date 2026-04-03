"use client";

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

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${open ? "open" : ""}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${open ? "open" : ""}`}>
        {/* Brand */}
        <div style={{ padding: "1.25rem 1rem", borderBottom: `1px solid var(--card-border)` }}>
          <Link href="/" onClick={onClose} style={{ textDecoration: "none" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent)" }}>
              StockQuant
            </span>
          </Link>
          <p style={{ fontSize: ".7rem", color: "var(--muted)", marginTop: ".25rem" }}>
            Quant Research Platform
          </p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: ".5rem 0" }}>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/" || pathname === ""
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`nav-link ${isActive ? "active" : ""}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: ".75rem 1rem", borderTop: `1px solid var(--card-border)`, fontSize: ".7rem", color: "var(--muted)" }}>
          <p style={{ color: "var(--yellow)", fontWeight: 600, marginBottom: ".2rem" }}>
            For Education Only
          </p>
          <p>Not financial advice.</p>
        </div>
      </aside>
    </>
  );
}
