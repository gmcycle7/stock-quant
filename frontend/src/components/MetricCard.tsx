"use client";

/**
 * Metric Card — displays a single metric with label, value, and optional color coding.
 * Used throughout the dashboard and backtest results.
 */

interface Props {
  label: string;
  value: string | number;
  suffix?: string;
  positive?: boolean | null; // true=green, false=red, null=neutral
  description?: string;
}

export default function MetricCard({ label, value, suffix = "", positive = null, description }: Props) {
  let colorStyle = "var(--foreground)";
  if (positive === true) colorStyle = "var(--green)";
  if (positive === false) colorStyle = "var(--red)";

  return (
    <div className="card">
      <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>
        {label}
      </p>
      <p className="text-xl font-bold" style={{ color: colorStyle }}>
        {typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}
        {suffix && <span className="text-sm font-normal ml-1">{suffix}</span>}
      </p>
      {description && (
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          {description}
        </p>
      )}
    </div>
  );
}
