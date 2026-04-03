"use client";

import { useState } from "react";

/**
 * Prominent disclaimer banner shown at the top of the application.
 * Can be dismissed by the user for the current session.
 */
export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="flex items-center justify-between px-4 py-2 text-sm"
      style={{ background: "#78350f", color: "#fef3c7" }}
    >
      <span>
        <strong>Disclaimer:</strong> This platform is for educational and research purposes only.
        It does NOT constitute financial advice. Past performance does not guarantee future results.
        Do NOT trade real money based solely on this system.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-4 px-2 py-1 rounded text-xs font-bold hover:bg-yellow-800"
      >
        Dismiss
      </button>
    </div>
  );
}
