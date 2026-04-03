"""
Strategy Registry — Central catalog of all available strategies.

WHY THIS EXISTS:
When the API receives a request like "run backtest with ma_crossover strategy",
it needs to know which Python class to instantiate. The registry maps
strategy names (strings) to their classes.

HOW TO ADD A NEW STRATEGY:
1. Create a new file in quant/strategies/ (e.g., my_strategy.py)
2. Subclass BaseStrategy and implement generate_signals()
3. Import it here and add it to STRATEGY_REGISTRY

MATLAB ANALOGY:
This is like a switch statement:
    switch strategyName
        case 'ma_crossover'
            signals = maCrossover(data, params);
        case 'rsi_reversion'
            signals = rsiReversion(data, params);
    end
"""

import pandas as pd

from quant.strategies.ma_crossover import MACrossoverStrategy
from quant.strategies.rsi_reversion import RSIReversionStrategy
from quant.strategies.bollinger_band import BollingerBandStrategy
from quant.strategies.momentum import MomentumStrategy
from quant.strategies.macd_trend import MACDTrendStrategy

# ============================================
# Strategy Registry
# ============================================
# Maps strategy name (string) → strategy class
_STRATEGY_CLASSES = {
    "ma_crossover": MACrossoverStrategy,
    "rsi_reversion": RSIReversionStrategy,
    "bollinger_band": BollingerBandStrategy,
    "momentum": MomentumStrategy,
    "macd_trend": MACDTrendStrategy,
}

# Build the registry with metadata for the API
STRATEGY_REGISTRY = {}
for name, cls in _STRATEGY_CLASSES.items():
    instance = cls()
    STRATEGY_REGISTRY[name] = instance.get_info()


def get_strategy_info(name: str) -> dict | None:
    """Get metadata for a strategy by name."""
    return STRATEGY_REGISTRY.get(name)


def run_strategy(name: str, df: pd.DataFrame, params: dict) -> pd.DataFrame:
    """
    Instantiate a strategy and generate signals.

    Args:
        name: Strategy name (e.g., "ma_crossover")
        df: Price DataFrame with OHLCV columns
        params: Strategy-specific parameters

    Returns:
        DataFrame with signal column added

    Raises:
        ValueError: If strategy name is not found
    """
    if name not in _STRATEGY_CLASSES:
        raise ValueError(
            f"Unknown strategy '{name}'. "
            f"Available: {list(_STRATEGY_CLASSES.keys())}"
        )

    strategy_class = _STRATEGY_CLASSES[name]
    strategy = strategy_class(params)
    return strategy.generate_signals(df)
