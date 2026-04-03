"use client";

/**
 * Equity Curve Chart — shows portfolio value over time.
 *
 * This is the most important chart for evaluating a strategy.
 * A good equity curve goes up smoothly. A bad one is choppy or goes down.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface Props {
  data: { date: string; equity: number }[];
  benchmarkData?: { date: string; close: number }[] | null;
  initialCapital?: number;
  height?: number;
}

export default function EquityCurve({
  data,
  benchmarkData,
  initialCapital = 100000,
  height = 350,
}: Props) {
  if (!data.length) {
    return <div className="text-center py-8 text-muted">No equity curve data</div>;
  }

  // Normalize benchmark to start at initial capital for fair comparison
  let mergedData = data.map((d) => ({ ...d }));

  if (benchmarkData && benchmarkData.length > 0) {
    const benchStart = benchmarkData[0].close;
    const benchMap = new Map(
      benchmarkData.map((b) => [
        b.date,
        (b.close / benchStart) * initialCapital,
      ])
    );
    mergedData = mergedData.map((d) => ({
      ...d,
      benchmark: benchMap.get(d.date) ?? null,
    }));
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={mergedData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="date"
          stroke="#94a3b8"
          fontSize={11}
          tickFormatter={(v) => v.slice(5)} // Show MM-DD
        />
        <YAxis
          stroke="#94a3b8"
          fontSize={11}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
          labelStyle={{ color: "#94a3b8" }}
          formatter={(value, name) => [`$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, name === "equity" ? "Strategy" : "Benchmark (SPY)"]}
        />
        <ReferenceLine y={initialCapital} stroke="#64748b" strokeDasharray="3 3" label="" />
        <Line
          type="monotone"
          dataKey="equity"
          stroke="#3b82f6"
          dot={false}
          strokeWidth={2}
          name="equity"
        />
        {benchmarkData && (
          <Line
            type="monotone"
            dataKey="benchmark"
            stroke="#94a3b8"
            dot={false}
            strokeWidth={1}
            strokeDasharray="4 4"
            name="benchmark"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
