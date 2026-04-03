"""
Base Strategy Class.

WHY THIS EXISTS:
Every trading strategy follows the same pattern:
1. Take price data
2. Compute some indicators
3. Generate buy/sell signals based on rules

This base class defines that pattern so all strategies look and work
the same way. This makes it easy to:
- Add new strategies without changing the backtest engine
- Compare strategies fairly
- Display them consistently in the UI

MATLAB ANALOGY:
Think of this as an abstract class or a template. In MATLAB, you might
have a function signature that all your strategy functions must follow:
    signals = myStrategy(priceData, params)
Here we formalize that with a Python class.

THE SIGNAL COLUMN:
Every strategy must produce a 'signal' column in the output DataFrame:
    1  = Buy signal  (enter long position)
    -1 = Sell signal (exit/sell position)
    0  = No action   (hold current position)
"""

from abc import ABC, abstractmethod
import pandas as pd


class BaseStrategy(ABC):
    """
    Abstract base class for all trading strategies.

    To create a new strategy:
    1. Create a new file in quant/strategies/
    2. Subclass BaseStrategy
    3. Implement the `generate_signals` method
    4. Register it in quant/strategies/registry.py
    """

    # Subclasses should set these
    name: str = "base"
    display_name: str = "Base Strategy"
    description: str = "Base strategy class"
    category: str = "general"

    # Default parameters — subclasses override this
    default_params: dict = {}

    # Parameter metadata for the UI (name, type, min, max, default, description)
    param_schema: list[dict] = []

    def __init__(self, params: dict | None = None):
        """
        Initialize strategy with parameters.

        Args:
            params: Dictionary of parameter values. Missing keys
                    fall back to default_params.
        """
        # Merge provided params with defaults
        self.params = {**self.default_params}
        if params:
            self.params.update(params)

    @abstractmethod
    def generate_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Generate trading signals from price data.

        MUST be implemented by every strategy subclass.

        Args:
            df: DataFrame with columns: open, high, low, close, volume
                Index must be DatetimeIndex.

        Returns:
            DataFrame with all original columns PLUS:
            - 'signal': 1 (buy), -1 (sell), or 0 (hold)
            - Any indicator columns the strategy computed
        """
        pass

    def get_info(self) -> dict:
        """Return strategy metadata for the API/UI."""
        return {
            "name": self.name,
            "display_name": self.display_name,
            "description": self.description,
            "category": self.category,
            "parameters": self.param_schema,
            "default_params": self.default_params,
        }
