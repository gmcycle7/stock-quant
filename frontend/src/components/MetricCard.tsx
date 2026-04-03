"use client";

interface Props {
  label: string;
  value: string | number;
  suffix?: string;
  positive?: boolean | null;
}

export default function MetricCard({ label, value, suffix = "", positive = null }: Props) {
  let color = "var(--foreground)";
  if (positive === true) color = "var(--green)";
  if (positive === false) color = "var(--red)";

  const display = typeof value === "number"
    ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : value;

  return (
    <div className="metric-card">
      <div className="label">{label}</div>
      <div className="value" style={{ color }}>
        {display}
        {suffix && <span style={{ fontSize: ".75rem", fontWeight: 400, marginLeft: ".25rem" }}>{suffix}</span>}
      </div>
    </div>
  );
}
