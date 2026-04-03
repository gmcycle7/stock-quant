"use client";

/**
 * Drawdown Chart — shows peak-to-trough declines in portfolio value.
 *
 * Drawdown measures how much the portfolio has fallen from its highest point.
 * Smaller (less negative) drawdowns are better — they mean less pain.
 * Max drawdown is the worst decline, and it's a key risk metric.
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: { date: string; equity: number }[];
  height?: number;
}

export default function DrawdownChart({ data, height = 250 }: Props) {
  if (!data.length) {
    return <div className="text-center py-8 text-muted">No data</div>;
  }

  // Compute drawdown from equity curve
  let peak = data[0].equity;
  const drawdownData = data.map((d) => {
    if (d.equity > peak) peak = d.equity;
    const drawdown = ((d.equity - peak) / peak) * 100;
    return { date: d.date, drawdown: Number(drawdown.toFixed(2)) };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={drawdownData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
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
          tickFormatter={(v: number) => `${v.toFixed(1)}%`}
        />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
          formatter={(value) => [`${Number(value).toFixed(2)}%`, "Drawdown"]}
        />
        <Area
          type="monotone"
          dataKey="drawdown"
          stroke="#ef4444"
          fill="#ef4444"
          fillOpacity={0.2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
