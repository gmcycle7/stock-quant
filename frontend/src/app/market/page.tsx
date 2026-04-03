"use client";

/**
 * Market Data Explorer Page.
 *
 * Allows users to:
 * - Search for and select stock symbols
 * - View OHLCV price data with indicator overlays
 * - Add/remove symbols from watchlist
 * - Refresh data from the provider
 */

import { useEffect, useState, useCallback } from "react";
import {
  fetchSymbols,
  fetchIndicators,
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  refreshSymbolData,
  WatchlistItem,
} from "@/lib/api";
import PriceChart from "@/components/charts/PriceChart";

export default function MarketPage() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [searchInput, setSearchInput] = useState("");
  const [chartData, setChartData] = useState<Record<string, unknown>[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  // Indicator settings
  const [showSMA, setShowSMA] = useState(true);
  const [showBB, setShowBB] = useState(false);

  const loadSymbols = useCallback(async () => {
    try {
      const data = await fetchSymbols();
      setSymbols(data.symbols);
    } catch {
      // Backend might not be running
    }
  }, []);

  const loadWatchlist = useCallback(async () => {
    try {
      const data = await fetchWatchlist();
      setWatchlist(data.watchlist);
    } catch {
      // ignore
    }
  }, []);

  const loadChartData = useCallback(async (symbol: string) => {
    setLoading(true);
    try {
      const indicators = [
        "sma_20",
        "sma_50",
        ...(showBB ? ["bb_20"] : []),
        "rsi_14",
      ].join(",");
      const data = await fetchIndicators(symbol, indicators);
      // Map sma_20 → fast_ma, sma_50 → slow_ma for chart
      const mapped = data.data.map((d: Record<string, unknown>) => ({
        ...d,
        fast_ma: d.sma_20 ?? null,
        slow_ma: d.sma_50 ?? null,
      }));
      setChartData(mapped);
    } catch {
      setChartData([]);
      setMessage("Failed to load data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [showBB]);

  useEffect(() => {
    loadSymbols();
    loadWatchlist();
  }, [loadSymbols, loadWatchlist]);

  useEffect(() => {
    if (selectedSymbol) {
      loadChartData(selectedSymbol);
    }
  }, [selectedSymbol, loadChartData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage("");
    try {
      const result = await refreshSymbolData(selectedSymbol);
      setMessage(result.message);
      await loadChartData(selectedSymbol);
      await loadSymbols();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    const sym = searchInput.trim().toUpperCase();
    if (sym) {
      setSelectedSymbol(sym);
      setSearchInput("");
    }
  };

  const isInWatchlist = watchlist.some((w) => w.symbol === selectedSymbol);

  const toggleWatchlist = async () => {
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(selectedSymbol);
      } else {
        await addToWatchlist(selectedSymbol);
      }
      await loadWatchlist();
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Market Data Explorer</h1>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Symbol Search */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Enter symbol (e.g., AAPL)"
            className="input-field w-48"
          />
          <button onClick={handleSearch} className="btn-primary text-sm">
            Go
          </button>
        </div>

        {/* Symbol Selector */}
        <select
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          className="select-field w-32"
        >
          {symbols.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Actions */}
        <button onClick={handleRefresh} disabled={refreshing} className="btn-secondary text-sm">
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
        <button onClick={toggleWatchlist} className="btn-secondary text-sm">
          {isInWatchlist ? "- Remove from Watchlist" : "+ Add to Watchlist"}
        </button>

        {/* Indicator toggles */}
        <label className="flex items-center gap-1 text-sm" style={{ color: "var(--muted)" }}>
          <input type="checkbox" checked={showSMA} onChange={(e) => setShowSMA(e.target.checked)} />
          SMA
        </label>
        <label className="flex items-center gap-1 text-sm" style={{ color: "var(--muted)" }}>
          <input type="checkbox" checked={showBB} onChange={(e) => setShowBB(e.target.checked)} />
          Bollinger
        </label>
      </div>

      {message && (
        <div className="text-sm mb-3" style={{ color: "var(--accent)" }}>{message}</div>
      )}

      {/* Price Chart */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--muted)" }}>
          {selectedSymbol} — Price Chart {loading && "(Loading...)"}
        </h2>
        <PriceChart
          data={chartData as { date: string; close: number }[]}
          showMA={showSMA}
          showBB={showBB}
          height={450}
        />
      </div>

      {/* Price Table (last 20 rows) */}
      <div className="card">
        <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--muted)" }}>
          Recent Prices ({chartData.length} total data points)
        </h2>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0" style={{ background: "var(--card-bg)" }}>
              <tr style={{ color: "var(--muted)" }}>
                <th className="text-left py-1 px-2">Date</th>
                <th className="text-right py-1 px-2">Open</th>
                <th className="text-right py-1 px-2">High</th>
                <th className="text-right py-1 px-2">Low</th>
                <th className="text-right py-1 px-2">Close</th>
                <th className="text-right py-1 px-2">Volume</th>
              </tr>
            </thead>
            <tbody>
              {chartData.slice(-20).reverse().map((row, i) => (
                <tr key={i} className="border-b" style={{ borderColor: "var(--card-border)" }}>
                  <td className="py-1 px-2">{String(row.date)}</td>
                  <td className="py-1 px-2 text-right">${Number(row.open).toFixed(2)}</td>
                  <td className="py-1 px-2 text-right">${Number(row.high).toFixed(2)}</td>
                  <td className="py-1 px-2 text-right">${Number(row.low).toFixed(2)}</td>
                  <td className="py-1 px-2 text-right">${Number(row.close).toFixed(2)}</td>
                  <td className="py-1 px-2 text-right">{Number(row.volume).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
