"""
Tests for the backtesting engine.

Verifies that the backtester correctly:
1. Tracks cash and positions
2. Applies commissions and slippage
3. Computes accurate equity curves
4. Records trades properly
"""

import pytest
import pandas as pd
import numpy as np
from quant.backtest.engine import Backtester


@pytest.fixture
def simple_buy_sell_data():
    """
    Create data with explicit buy/sell signals for predictable testing.
    Price goes from 100 to 110 (buy), then we sell.
    """
    dates = pd.date_range("2023-01-01", periods=10, freq="B")
    df = pd.DataFrame({
        "open": [100, 101, 102, 103, 104, 105, 106, 107, 108, 109],
        "high": [101, 102, 103, 104, 105, 106, 107, 108, 109, 110],
        "low": [99, 100, 101, 102, 103, 104, 105, 106, 107, 108],
        "close": [100, 101, 102, 103, 104, 105, 106, 107, 108, 110],
        "volume": [1000000] * 10,
        "signal": [1, 0, 0, 0, 0, 0, 0, 0, 0, -1],  # Buy day 1, sell day 10
    }, index=dates)
    return df


@pytest.fixture
def no_signal_data():
    """Data with no signals — portfolio should stay at initial capital."""
    dates = pd.date_range("2023-01-01", periods=10, freq="B")
    df = pd.DataFrame({
        "open": [100] * 10,
        "high": [101] * 10,
        "low": [99] * 10,
        "close": [100] * 10,
        "volume": [1000000] * 10,
        "signal": [0] * 10,
    }, index=dates)
    return df


class TestBacktester:
    def test_no_trades_preserves_capital(self, no_signal_data):
        bt = Backtester(initial_capital=100000)
        result = bt.run(no_signal_data)
        # With no trades, equity should stay at initial capital
        assert result["metrics"]["total_return"] == 0
        assert result["metrics"]["num_trades"] == 0
        assert result["equity_curve"][-1]["equity"] == 100000

    def test_buy_then_sell(self, simple_buy_sell_data):
        bt = Backtester(
            initial_capital=100000,
            commission_pct=0,
            slippage_pct=0,
            position_size_pct=100,
            max_positions=1,
        )
        result = bt.run(simple_buy_sell_data)
        # Should have executed 2 trades: 1 buy + 1 sell
        assert len(result["trades"]) == 2
        # Should have positive return (bought at 100, sold at 110)
        assert result["metrics"]["total_return"] > 0

    def test_equity_curve_has_correct_length(self, simple_buy_sell_data):
        bt = Backtester(initial_capital=100000)
        result = bt.run(simple_buy_sell_data)
        assert len(result["equity_curve"]) == len(simple_buy_sell_data)

    def test_commission_reduces_return(self, simple_buy_sell_data):
        bt_no_cost = Backtester(initial_capital=100000, commission_pct=0, slippage_pct=0)
        bt_with_cost = Backtester(initial_capital=100000, commission_pct=0.01, slippage_pct=0)

        result_no_cost = bt_no_cost.run(simple_buy_sell_data)
        result_with_cost = bt_with_cost.run(simple_buy_sell_data)

        # With commissions, return should be lower
        assert result_with_cost["metrics"]["total_return"] < result_no_cost["metrics"]["total_return"]

    def test_missing_signal_column_raises(self):
        df = pd.DataFrame({"close": [100, 101]}, index=pd.date_range("2023-01-01", periods=2))
        bt = Backtester()
        with pytest.raises(ValueError, match="signal"):
            bt.run(df)

    def test_metrics_contain_required_keys(self, simple_buy_sell_data):
        bt = Backtester()
        result = bt.run(simple_buy_sell_data)
        required_keys = [
            "total_return", "sharpe_ratio", "max_drawdown",
            "win_rate", "num_trades", "profit_factor",
        ]
        for key in required_keys:
            assert key in result["metrics"], f"Missing metric: {key}"
