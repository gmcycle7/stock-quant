"""
Bollinger Band Mean Reversion Strategy.

THE IDEA:
Bollinger Bands create an envelope around the price based on volatility.
When price drops below the lower band, it's abnormally low → BUY (expect bounce).
When price rises above the upper band, it's abnormally high → SELL (expect pullback).

WHY IT WORKS (sometimes):
Price tends to stay within about 2 standard deviations of its mean.
When it breaks out, it often snaps back. The bands automatically adjust
to market volatility — wider in volatile markets, narrower in calm markets.

LIMITATIONS:
- In a strong trend, price can "ride" the band for long periods
- Breakouts through bands can signal trend continuation, not reversal
- Works best in range-bound markets
"""

import pandas as pd
from quant.strategies.base import BaseStrategy
from quant.indicators.technical import compute_bollinger_bands


class BollingerBandStrategy(BaseStrategy):
    name = "bollinger_band"
    display_name = "Bollinger Band Reversion"
    description = (
        "Buys when price drops below the lower Bollinger Band (oversold), "
        "sells when price rises above the upper band (overbought). "
        "A volatility-based mean reversion strategy."
    )
    category = "mean_reversion"

    default_params = {
        "bb_period": 20,
        "bb_std": 2.0,
    }

    param_schema = [
        {
            "name": "bb_period",
            "type": "int",
            "min": 5,
            "max": 100,
            "default": 20,
            "description": "Lookback period for Bollinger Band SMA and standard deviation",
        },
        {
            "name": "bb_std",
            "type": "float",
            "min": 0.5,
            "max": 4.0,
            "default": 2.0,
            "description": "Number of standard deviations for the bands",
        },
    ]

    def generate_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        result = df.copy()

        period = int(self.params["bb_period"])
        num_std = float(self.params["bb_std"])

        bb = compute_bollinger_bands(result["close"], period, num_std)
        result["bb_upper"] = bb["bb_upper"]
        result["bb_middle"] = bb["bb_middle"]
        result["bb_lower"] = bb["bb_lower"]

        result["signal"] = 0

        close = result["close"]
        prev_close = close.shift(1)

        # Buy: price crosses below lower band
        result.loc[(close < result["bb_lower"]) & (prev_close >= result["bb_lower"].shift(1)), "signal"] = 1

        # Sell: price crosses above upper band
        result.loc[(close > result["bb_upper"]) & (prev_close <= result["bb_upper"].shift(1)), "signal"] = -1

        return result
