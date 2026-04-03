"""
Momentum Strategy.

THE IDEA:
Stocks that have been going up tend to continue going up (momentum).
We measure momentum as the rate of change over a lookback period.
Buy when momentum is strong and positive. Sell when it turns negative.

WHY IT WORKS (sometimes):
Behavioral finance explains this through:
- Herding: investors follow trends
- Underreaction: new information takes time to be fully priced in
- Anchoring: investors adjust slowly to new fair values

This is the opposite of mean reversion — we bet that trends continue.

LIMITATIONS:
- Momentum can reverse suddenly (momentum crashes)
- High turnover (frequent trading) increases costs
- Works best over medium time horizons (1-12 months)
"""

import pandas as pd
import numpy as np
from quant.strategies.base import BaseStrategy
from quant.indicators.technical import compute_sma, compute_rsi


class MomentumStrategy(BaseStrategy):
    name = "momentum"
    display_name = "Momentum"
    description = (
        "Buys when price momentum (rate of change) is strongly positive "
        "and confirmed by trend. Sells when momentum turns negative. "
        "A trend-following momentum strategy."
    )
    category = "trend"

    default_params = {
        "lookback": 20,        # Period for rate of change
        "ma_period": 50,       # Trend filter: only buy if above this MA
        "momentum_threshold": 0.0,  # Min momentum % to trigger buy
    }

    param_schema = [
        {
            "name": "lookback",
            "type": "int",
            "min": 5,
            "max": 252,
            "default": 20,
            "description": "Lookback period for momentum (rate of change) calculation",
        },
        {
            "name": "ma_period",
            "type": "int",
            "min": 10,
            "max": 200,
            "default": 50,
            "description": "Moving average period for trend filter",
        },
        {
            "name": "momentum_threshold",
            "type": "float",
            "min": -10.0,
            "max": 20.0,
            "default": 0.0,
            "description": "Minimum momentum (%) to trigger a buy signal",
        },
    ]

    def generate_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        result = df.copy()

        lookback = int(self.params["lookback"])
        ma_period = int(self.params["ma_period"])
        threshold = float(self.params["momentum_threshold"])

        # Compute momentum as rate of change (percentage)
        result["momentum"] = (result["close"] / result["close"].shift(lookback) - 1) * 100

        # Trend filter: only trade when price is above its moving average
        result["trend_ma"] = compute_sma(result["close"], ma_period)

        result["signal"] = 0

        momentum = result["momentum"]
        prev_momentum = momentum.shift(1)
        above_ma = result["close"] > result["trend_ma"]

        # Buy: momentum crosses above threshold AND price is above trend MA
        result.loc[
            (momentum > threshold) & (prev_momentum <= threshold) & above_ma,
            "signal",
        ] = 1

        # Sell: momentum crosses below zero (trend reversing)
        result.loc[
            (momentum < 0) & (prev_momentum >= 0),
            "signal",
        ] = -1

        return result
