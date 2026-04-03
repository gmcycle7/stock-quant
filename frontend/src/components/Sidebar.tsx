"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n, TKey } from "@/lib/i18n";

const NAV_ITEMS: { href: string; labelKey: TKey; icon: string }[] = [
  { href: "/", labelKey: "nav_home", icon: "🏠" },
  { href: "/dashboard", labelKey: "nav_dashboard", icon: "📊" },
  { href: "/market", labelKey: "nav_market", icon: "📈" },
  { href: "/strategies", labelKey: "nav_strategies", icon: "🧪" },
  { href: "/backtest", labelKey: "nav_backtest", icon: "⏱️" },
  { href: "/paper-trading", labelKey: "nav_paper", icon: "💵" },
  { href: "/portfolio", labelKey: "nav_portfolio", icon: "💼" },
  { href: "/leaderboard", labelKey: "nav_leaderboard", icon: "🏆" },
  { href: "/docs", labelKey: "nav_docs", icon: "📖" },
  { href: "/settings", labelKey: "nav_settings", icon: "⚙️" },
];

interface Props { open: boolean; onClose: () => void }

export default function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname();
  const { lang, t, setLang } = useI18n();

  return (
    <>
      <div className={`sidebar-overlay ${open ? "open" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        {/* Brand */}
        <div style={{ padding: "1.25rem 1rem", borderBottom: "1px solid var(--card-border)" }}>
          <Link href="/" onClick={onClose} style={{ textDecoration: "none" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent)" }}>StockQuant</span>
          </Link>
          <p style={{ fontSize: ".7rem", color: "var(--muted)", marginTop: ".25rem" }}>{t("brand_sub")}</p>
        </div>

        {/* Language Toggle */}
        <div style={{ display: "flex", gap: "2px", padding: ".5rem .75rem 0", fontSize: ".75rem" }}>
          <button
            onClick={() => setLang("en")}
            style={{
              flex: 1, padding: ".3rem", borderRadius: ".3rem 0 0 .3rem", border: "none", cursor: "pointer",
              background: lang === "en" ? "var(--accent)" : "var(--card-border)",
              color: lang === "en" ? "#fff" : "var(--muted)", fontWeight: 600, transition: "background .15s",
            }}
          >EN</button>
          <button
            onClick={() => setLang("zh")}
            style={{
              flex: 1, padding: ".3rem", borderRadius: "0 .3rem .3rem 0", border: "none", cursor: "pointer",
              background: lang === "zh" ? "var(--accent)" : "var(--card-border)",
              color: lang === "zh" ? "#fff" : "var(--muted)", fontWeight: 600, transition: "background .15s",
            }}
          >中文</button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: ".5rem 0" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" || pathname === "" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={onClose} className={`nav-link ${isActive ? "active" : ""}`}>
                <span>{item.icon}</span>
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: ".75rem 1rem", borderTop: "1px solid var(--card-border)", fontSize: ".7rem", color: "var(--muted)" }}>
          <p style={{ color: "var(--yellow)", fontWeight: 600, marginBottom: ".2rem" }}>{t("edu_only")}</p>
          <p>{t("not_advice")}</p>
        </div>
      </aside>
    </>
  );
}
