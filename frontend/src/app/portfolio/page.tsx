"use client";

/**
 * Portfolio Page — detailed view of the paper trading portfolio.
 */

import { useEffect, useState } from "react";
import { fetchPortfolio, PortfolioSummary } from "@/lib/api";
import MetricCard from "@/components/MetricCard";
import { useI18n } from "@/lib/i18n";

export default function PortfolioPage() {
  const { t } = useI18n();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolio(1)
      .then(setPortfolio)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center" style={{ padding: "3rem 0", color: "var(--muted)" }}>
        {t("loading")}
      </div>
    );
  }

  if (!portfolio || portfolio.error) {
    return (
      <div className="card text-center" style={{ padding: "3rem", color: "var(--muted)" }}>
        {t("pf_not_found")}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("pf_title")}</h1>

      {/* Summary Cards */}
      <div className="grid-4 mb-6" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        <MetricCard label={t("total_equity")} value={`$${portfolio.total_equity.toLocaleString()}`} />
        <MetricCard label={t("cash")} value={`$${portfolio.cash.toLocaleString()}`} />
        <MetricCard label={t("positions_val")} value={`$${portfolio.positions_value.toLocaleString()}`} />
        <MetricCard label={t("pf_initial")} value={`$${portfolio.initial_capital.toLocaleString()}`} />
        <MetricCard
          label={t("total_return")}
          value={portfolio.total_return_pct}
          suffix="%"
          positive={portfolio.total_return_pct >= 0}
        />
      </div>

      {/* Positions Table */}
      <div className="card">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>
          {t("pf_open_pos")} <span className="font-normal">({portfolio.positions.length})</span>
        </h2>

        {portfolio.positions.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>{t("pt_no_pos")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("col_symbol")}</th>
                  <th style={{ textAlign: "right" }}>{t("col_shares")}</th>
                  <th style={{ textAlign: "right" }}>{t("col_avg_entry")}</th>
                  <th style={{ textAlign: "right" }}>{t("col_cur_price")}</th>
                  <th style={{ textAlign: "right" }}>{t("col_mkt_val")}</th>
                  <th style={{ textAlign: "right" }}>{t("col_unreal_pnl")}</th>
                  <th style={{ textAlign: "right" }}>{t("col_pnl_pct")}</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((pos) => (
                  <tr key={pos.id}>
                    <td style={{ fontWeight: 700 }}>{pos.symbol}</td>
                    <td style={{ textAlign: "right" }}>{pos.shares}</td>
                    <td style={{ textAlign: "right" }}>${pos.avg_entry_price.toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>${pos.current_price.toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>${pos.market_value.toLocaleString()}</td>
                    <td
                      style={{
                        textAlign: "right",
                        color: pos.unrealized_pnl >= 0 ? "var(--green)" : "var(--red)",
                        fontWeight: 600,
                      }}
                    >
                      {pos.unrealized_pnl >= 0 ? "+" : ""}${pos.unrealized_pnl.toFixed(2)}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        color: pos.unrealized_pnl_pct >= 0 ? "var(--green)" : "var(--red)",
                        fontWeight: 600,
                      }}
                    >
                      {pos.unrealized_pnl_pct >= 0 ? "+" : ""}{pos.unrealized_pnl_pct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
