"use client";

/**
 * Price Chart with Buy/Sell Markers.
 *
 * Shows the stock price over time with:
 * - Close price line
 * - Optional indicator overlays (moving averages, Bollinger Bands)
 * - Buy signals (green triangles) and sell signals (red triangles)
 */

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
} from "recharts";
import { TradeRecord } from "@/lib/api";

interface PricePoint {
  date: string;
  close: number;
  fast_ma?: number | null;
  slow_ma?: number | null;
  bb_upper?: number | null;
  bb_lower?: number | null;
  bb_middle?: number | null;
  [key: string]: unknown;
}

interface Props {
  data: PricePoint[];
  trades?: TradeRecord[];
  showMA?: boolean;
  showBB?: boolean;
  height?: number;
}

export default function PriceChart({
  data,
  trades = [],
  showMA = false,
  showBB = false,
  height = 400,
}: Props) {
  if (!data.length) {
    return <div className="text-center py-8 text-muted">No price data</div>;
  }

  // Merge trade signals into price data
  const buyDates = new Set(trades.filter((t) => t.side === "buy").map((t) => t.date));
  const sellDates = new Set(trades.filter((t) => t.side === "sell").map((t) => t.date));

  const chartData = data.map((d) => ({
    ...d,
    buySignal: buyDates.has(d.date) ? d.close : null,
    sellSignal: sellDates.has(d.date) ? d.close : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="date"
          stroke="#94a3b8"
          fontSize={11}
          tickFormatter={(v) => v.slice(5)}
        />
        <YAxis
          stroke="#94a3b8"
          fontSize={11}
          domain={["auto", "auto"]}
          tickFormatter={(v: number) => `$${v.toFixed(0)}`}
        />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
          labelStyle={{ color: "#94a3b8" }}
        />

        {/* Bollinger Bands */}
        {showBB && (
          <>
            <Line type="monotone" dataKey="bb_upper" stroke="#64748b" dot={false} strokeWidth={1} strokeDasharray="2 2" />
            <Line type="monotone" dataKey="bb_lower" stroke="#64748b" dot={false} strokeWidth={1} strokeDasharray="2 2" />
            <Line type="monotone" dataKey="bb_middle" stroke="#64748b" dot={false} strokeWidth={1} />
          </>
        )}

        {/* Moving Averages */}
        {showMA && (
          <>
            <Line type="monotone" dataKey="fast_ma" stroke="#f59e0b" dot={false} strokeWidth={1.5} name="Fast MA" />
            <Line type="monotone" dataKey="slow_ma" stroke="#a855f7" dot={false} strokeWidth={1.5} name="Slow MA" />
          </>
        )}

        {/* Close Price */}
        <Line type="monotone" dataKey="close" stroke="#3b82f6" dot={false} strokeWidth={2} name="Close" />

        {/* Buy/Sell Markers */}
        <Scatter dataKey="buySignal" fill="#22c55e" shape="triangle" name="Buy" />
        <Scatter dataKey="sellSignal" fill="#ef4444" shape="triangle" name="Sell" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
