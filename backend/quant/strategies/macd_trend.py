"""
MACD Trend Strategy.

THE IDEA:
Use the MACD indicator to identify trend changes.
Buy when the MACD line crosses above the signal line (bullish crossover).
Sell when MACD crosses below the signal line (bearish crossover).
Optionally filter for the histogram to confirm signal strength.

WHY IT WORKS (sometimes):
MACD combines trend and momentum into one indicator. The crossover
of the MACD line with its signal line is like a "smoothed" version
of a moving average crossover, reducing some false signals.

LIMITATIONS:
- Still lags behind actual price movements
- Can give false signals in choppy markets
- The "default" 12/26/9 parameters may not be optimal for all stocks
"""

import pandas as pd
from quant.strategies.base import BaseStrategy
from quant.indicators.technical import compute_macd


class MACDTrendStrategy(BaseStrategy):
    name = "macd_trend"
    display_name = "MACD Trend"
    description = (
        "Buys on MACD bullish crossover (MACD line crosses above signal line), "
        "sells on bearish crossover. A popular trend-following indicator strategy."
    )
    category = "trend"

    default_params = {
        "fast_period": 12,
        "slow_period": 26,
        "signal_period": 9,
        "use_histogram_filter": True,
    }

    param_schema = [
        {
            "name": "fast_period",
            "type": "int",
            "min": 2,
            "max": 50,
            "default": 12,
            "description": "Fast EMA period for MACD calculation",
        },
        {
            "name": "slow_period",
            "type": "int",
            "min": 10,
            "max": 100,
            "default": 26,
            "description": "Slow EMA period for MACD calculation",
        },
        {
            "name": "signal_period",
            "type": "int",
            "min": 2,
            "max": 50,
            "default": 9,
            "description": "Signal line EMA period",
        },
        {
            "name": "use_histogram_filter",
            "type": "bool",
            "default": True,
            "description": "If true, only buy when histogram is also positive (stronger confirmation)",
        },
    ]

    def generate_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        result = df.copy()

        fast = int(self.params["fast_period"])
        slow = int(self.params["slow_period"])
        signal_p = int(self.params["signal_period"])
        use_hist = bool(self.params.get("use_histogram_filter", True))

        macd_df = compute_macd(result["close"], fast, slow, signal_p)
        result["macd_line"] = macd_df["macd_line"]
        result["macd_signal"] = macd_df["macd_signal"]
        result["macd_hist"] = macd_df["macd_hist"]

        result["signal"] = 0

        macd_line = result["macd_line"]
        signal_line = result["macd_signal"]
        histogram = result["macd_hist"]

        # Detect crossovers
        macd_above = macd_line > signal_line
        macd_above_prev = macd_above.shift(1).fillna(False).astype(bool)

        # Buy: MACD crosses above signal
        buy_condition = macd_above & ~macd_above_prev
        if use_hist:
            buy_condition = buy_condition & (histogram > 0)
        result.loc[buy_condition, "signal"] = 1

        # Sell: MACD crosses below signal
        sell_condition = ~macd_above & macd_above_prev
        result.loc[sell_condition, "signal"] = -1

        return result
