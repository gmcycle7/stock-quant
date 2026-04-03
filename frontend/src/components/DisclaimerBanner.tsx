"use client";

import { useState } from "react";

export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="disclaimer-banner">
      <span>
        <strong>Disclaimer:</strong> This platform is for educational and research purposes only.
        NOT financial advice. Do NOT trade real money based solely on this system.
      </span>
      <button onClick={() => setDismissed(true)}>Dismiss</button>
    </div>
  );
}
