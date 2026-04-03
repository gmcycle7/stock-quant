"""
Tests for the trading strategies module.

Verifies that each strategy:
1. Produces a 'signal' column
2. Only generates signals of -1, 0, or 1
3. Runs without errors on sample data
"""

import pytest
import pandas as pd
import numpy as np
from quant.strategies.registry import run_strategy, STRATEGY_REGISTRY


@pytest.fixture
def sample_data():
    """Create sample OHLCV data for strategy testing."""
    np.random.seed(42)
    n = 200  # Need enough data for indicators to warm up
    close = 100 + np.cumsum(np.random.randn(n) * 1.0)
    close = np.maximum(close, 10)  # Ensure positive prices
    df = pd.DataFrame({
        "open": close + np.random.randn(n) * 0.3,
        "high": close + abs(np.random.randn(n) * 0.5),
        "low": close - abs(np.random.randn(n) * 0.5),
        "close": close,
        "volume": np.random.randint(1000000, 5000000, n),
    }, index=pd.date_range("2022-01-01", periods=n, freq="B"))
    return df


class TestStrategyRegistry:
    def test_registry_has_5_strategies(self):
        assert len(STRATEGY_REGISTRY) == 5

    def test_all_strategies_have_required_fields(self):
        for name, info in STRATEGY_REGISTRY.items():
            assert "display_name" in info
            assert "description" in info
            assert "parameters" in info
            assert "category" in info


class TestAllStrategies:
    """Test that every registered strategy runs correctly."""

    @pytest.mark.parametrize("strategy_name", list(STRATEGY_REGISTRY.keys()))
    def test_strategy_produces_signal_column(self, strategy_name, sample_data):
        result = run_strategy(strategy_name, sample_data, {})
        assert "signal" in result.columns

    @pytest.mark.parametrize("strategy_name", list(STRATEGY_REGISTRY.keys()))
    def test_strategy_signals_are_valid(self, strategy_name, sample_data):
        result = run_strategy(strategy_name, sample_data, {})
        valid_signals = {-1, 0, 1}
        actual_signals = set(result["signal"].dropna().unique())
        assert actual_signals.issubset(valid_signals), f"Invalid signals: {actual_signals}"

    @pytest.mark.parametrize("strategy_name", list(STRATEGY_REGISTRY.keys()))
    def test_strategy_preserves_original_columns(self, strategy_name, sample_data):
        result = run_strategy(strategy_name, sample_data, {})
        for col in ["open", "high", "low", "close", "volume"]:
            assert col in result.columns

    def test_unknown_strategy_raises(self, sample_data):
        with pytest.raises(ValueError, match="Unknown strategy"):
            run_strategy("nonexistent", sample_data, {})
