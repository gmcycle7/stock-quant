"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { t } = useI18n();
  if (dismissed) return null;

  return (
    <div className="disclaimer-banner">
      <span><strong>⚠</strong> {t("disclaimer")}</span>
      <button onClick={() => setDismissed(true)}>{t("dismiss")}</button>
    </div>
  );
}
