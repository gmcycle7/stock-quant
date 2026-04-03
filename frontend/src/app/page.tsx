"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useI18n();

  const FEATURES = [
    { href: "/market", title: t("feat_market"), desc: t("feat_market_d"), icon: "📈" },
    { href: "/strategies", title: t("feat_strategy"), desc: t("feat_strategy_d"), icon: "🧪" },
    { href: "/backtest", title: t("feat_backtest"), desc: t("feat_backtest_d"), icon: "⏱️" },
    { href: "/paper-trading", title: t("feat_paper"), desc: t("feat_paper_d"), icon: "💵" },
    { href: "/dashboard", title: t("feat_dashboard"), desc: t("feat_dashboard_d"), icon: "📊" },
    { href: "/docs", title: t("feat_docs"), desc: t("feat_docs_d"), icon: "📖" },
  ];

  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "3rem 0 2rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--accent)", marginBottom: ".5rem" }}>
          {t("home_title")}
        </h1>
        <p style={{ fontSize: "1.1rem", marginBottom: ".25rem" }}>
          {t("home_subtitle")}
        </p>
        <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>
          {t("home_desc")}
        </p>
      </div>

      {/* Risk warning */}
      <div className="card" style={{ borderColor: "var(--yellow)", background: "#1c1917", textAlign: "center", marginBottom: "2rem" }}>
        <p style={{ color: "var(--yellow)", fontSize: ".85rem" }}>
          {t("home_warning")}
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
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: ".75rem" }}>{t("quick_start")}</h2>
        <ol style={{ paddingLeft: "1.25rem", fontSize: ".85rem", color: "var(--muted)", lineHeight: 2 }}>
          <li><strong style={{ color: "var(--foreground)" }}>{t("qs_1")}</strong> {t("qs_1b")} <Link href="/market" style={{ color: "var(--accent)" }}>{t("feat_market")}</Link></li>
          <li><strong style={{ color: "var(--foreground)" }}>{t("qs_2")}</strong> {t("qs_2b")} <Link href="/strategies" style={{ color: "var(--accent)" }}>{t("feat_strategy")}</Link></li>
          <li><strong style={{ color: "var(--foreground)" }}>{t("qs_3")}</strong> {t("qs_3b")} <Link href="/backtest" style={{ color: "var(--accent)" }}>{t("feat_backtest")}</Link></li>
          <li><strong style={{ color: "var(--foreground)" }}>{t("qs_4")}</strong> {t("qs_4b")} <Link href="/paper-trading" style={{ color: "var(--accent)" }}>{t("feat_paper")}</Link></li>
          <li><strong style={{ color: "var(--foreground)" }}>{t("qs_5")}</strong> {t("qs_5b")} <Link href="/docs" style={{ color: "var(--accent)" }}>{t("feat_docs")}</Link></li>
        </ol>
      </div>
    </div>
  );
}
