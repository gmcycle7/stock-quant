"""
Moving Average Crossover Strategy.

THE IDEA:
When a short-term moving average crosses ABOVE a long-term moving average,
it suggests the trend is turning bullish → BUY.
When the short-term crosses BELOW the long-term → SELL.

WHY IT WORKS (sometimes):
Moving averages smooth out noise. When the fast average (recent prices)
overtakes the slow average (older prices), it means recent prices are
rising faster than the long-term trend — momentum is shifting upward.

EXAMPLE:
- Fast MA (20-day) crosses above Slow MA (50-day) → Buy
- Fast MA (20-day) crosses below Slow MA (50-day) → Sell

LIMITATIONS:
- Lags behind the actual price (signals come after the move starts)
- Performs poorly in sideways/choppy markets (many false signals)
- Works best in trending markets

MATLAB ANALOGY:
    fast = movmean(close, 20);
    slow = movmean(close, 50);
    buy_signal = (fast > slow) & (lag(fast) <= lag(slow));
"""

import pandas as pd
from quant.strategies.base import BaseStrategy
from quant.indicators.technical import compute_sma, compute_ema


class MACrossoverStrategy(BaseStrategy):
    name = "ma_crossover"
    display_name = "Moving Average Crossover"
    description = (
        "Buys when a fast moving average crosses above a slow moving average, "
        "sells when it crosses below. Classic trend-following strategy."
    )
    category = "trend"

    default_params = {
        "fast_period": 20,
        "slow_period": 50,
        "ma_type": "sma",    # "sma" or "ema"
    }

    param_schema = [
        {
            "name": "fast_period",
            "type": "int",
            "min": 2,
            "max": 100,
            "default": 20,
            "description": "Period for the fast (short-term) moving average",
        },
        {
            "name": "slow_period",
            "type": "int",
            "min": 10,
            "max": 500,
            "default": 50,
            "description": "Period for the slow (long-term) moving average",
        },
        {
            "name": "ma_type",
            "type": "select",
            "options": ["sma", "ema"],
            "default": "sma",
            "description": "Type of moving average: SMA (simple) or EMA (exponential)",
        },
    ]

    def generate_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        result = df.copy()

        fast_period = int(self.params["fast_period"])
        slow_period = int(self.params["slow_period"])
        ma_type = self.params.get("ma_type", "sma")

        # Compute moving averages
        ma_func = compute_ema if ma_type == "ema" else compute_sma
        result["fast_ma"] = ma_func(result["close"], fast_period)
        result["slow_ma"] = ma_func(result["close"], slow_period)

        # Generate signals based on crossover
        # A crossover happens when fast_ma goes from below to above slow_ma
        result["signal"] = 0

        # Current state: fast > slow
        fast_above = result["fast_ma"] > result["slow_ma"]
        # Previous state (fillna to handle first row which has no previous)
        fast_above_prev = fast_above.shift(1).fillna(False).astype(bool)

        # Buy signal: fast crosses above slow (was below, now above)
        result.loc[fast_above & ~fast_above_prev, "signal"] = 1

        # Sell signal: fast crosses below slow (was above, now below)
        result.loc[~fast_above & fast_above_prev, "signal"] = -1

        return result
