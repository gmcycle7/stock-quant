"""
RSI Mean Reversion Strategy.

THE IDEA:
When RSI drops below a threshold (e.g., 30), the stock is "oversold" — it may
have dropped too far too fast and is likely to bounce back. → BUY.
When RSI rises above a threshold (e.g., 70), the stock is "overbought" — it may
have risen too far too fast and is likely to pull back. → SELL.

WHY IT WORKS (sometimes):
Markets tend to overreact. Extreme fear causes overselling, extreme greed
causes overbuying. RSI measures this extremity, and we bet on reversion
to the mean (prices returning to normal).

LIMITATIONS:
- In strong trends, RSI can stay overbought/oversold for long periods
- Need to pair with trend filters in practice
- Works best in range-bound markets
"""

import pandas as pd
from quant.strategies.base import BaseStrategy
from quant.indicators.technical import compute_rsi


class RSIReversionStrategy(BaseStrategy):
    name = "rsi_reversion"
    display_name = "RSI Mean Reversion"
    description = (
        "Buys when RSI indicates oversold conditions (below threshold), "
        "sells when RSI indicates overbought conditions (above threshold). "
        "A contrarian/mean-reversion strategy."
    )
    category = "mean_reversion"

    default_params = {
        "rsi_period": 14,
        "oversold": 30,
        "overbought": 70,
    }

    param_schema = [
        {
            "name": "rsi_period",
            "type": "int",
            "min": 2,
            "max": 50,
            "default": 14,
            "description": "Lookback period for RSI calculation",
        },
        {
            "name": "oversold",
            "type": "int",
            "min": 10,
            "max": 50,
            "default": 30,
            "description": "RSI level below which the stock is considered oversold (buy signal)",
        },
        {
            "name": "overbought",
            "type": "int",
            "min": 50,
            "max": 95,
            "default": 70,
            "description": "RSI level above which the stock is considered overbought (sell signal)",
        },
    ]

    def generate_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        result = df.copy()

        rsi_period = int(self.params["rsi_period"])
        oversold = float(self.params["oversold"])
        overbought = float(self.params["overbought"])

        result["rsi"] = compute_rsi(result["close"], rsi_period)
        result["signal"] = 0

        # Buy when RSI crosses below oversold threshold from above
        rsi = result["rsi"]
        prev_rsi = rsi.shift(1)

        # Buy: RSI drops into oversold territory
        result.loc[(rsi < oversold) & (prev_rsi >= oversold), "signal"] = 1

        # Sell: RSI rises into overbought territory
        result.loc[(rsi > overbought) & (prev_rsi <= overbought), "signal"] = -1

        return result
