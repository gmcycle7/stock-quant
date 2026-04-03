"""
Tests for the performance metrics module.
"""

import pytest
import pandas as pd
import numpy as np
from quant.analytics.metrics import compute_metrics, compute_monthly_returns


@pytest.fixture
def profitable_equity():
    """Equity curve that goes up steadily."""
    dates = pd.date_range("2023-01-01", periods=252, freq="B")
    # 10% annual return, relatively smooth
    daily_return = (1.10 ** (1/252)) - 1
    equity = 100000 * (1 + daily_return) ** np.arange(252)
    return pd.Series(equity, index=dates)


@pytest.fixture
def losing_equity():
    """Equity curve that goes down."""
    dates = pd.date_range("2023-01-01", periods=252, freq="B")
    daily_return = (0.90 ** (1/252)) - 1
    equity = 100000 * (1 + daily_return) ** np.arange(252)
    return pd.Series(equity, index=dates)


@pytest.fixture
def sample_trades():
    """Mix of winning and losing trades."""
    return [
        {"side": "buy", "pnl": 0, "pnl_pct": 0, "commission": 10},
        {"side": "sell", "pnl": 500, "pnl_pct": 5.0, "commission": 10},
        {"side": "buy", "pnl": 0, "pnl_pct": 0, "commission": 10},
        {"side": "sell", "pnl": -200, "pnl_pct": -2.0, "commission": 10},
        {"side": "buy", "pnl": 0, "pnl_pct": 0, "commission": 10},
        {"side": "sell", "pnl": 300, "pnl_pct": 3.0, "commission": 10},
    ]


class TestMetrics:
    def test_profitable_has_positive_return(self, profitable_equity, sample_trades):
        metrics = compute_metrics(profitable_equity, sample_trades)
        assert metrics["total_return"] > 0
        assert metrics["annualized_return"] > 0

    def test_losing_has_negative_return(self, losing_equity, sample_trades):
        metrics = compute_metrics(losing_equity, sample_trades)
        assert metrics["total_return"] < 0

    def test_drawdown_is_negative(self, profitable_equity, sample_trades):
        metrics = compute_metrics(profitable_equity, sample_trades)
        assert metrics["max_drawdown"] <= 0

    def test_win_rate_calculation(self, profitable_equity, sample_trades):
        metrics = compute_metrics(profitable_equity, sample_trades)
        # 2 winning, 1 losing → 66.7%
        assert metrics["win_rate"] == pytest.approx(66.7, abs=0.1)

    def test_profit_factor(self, profitable_equity, sample_trades):
        metrics = compute_metrics(profitable_equity, sample_trades)
        # Gross profit = 800, gross loss = 200 → PF = 4.0
        assert metrics["profit_factor"] == pytest.approx(4.0, abs=0.01)

    def test_empty_equity(self):
        metrics = compute_metrics(pd.Series(dtype=float), [])
        assert metrics["total_return"] == 0

    def test_num_trades_counts_sells_only(self, profitable_equity, sample_trades):
        metrics = compute_metrics(profitable_equity, sample_trades)
        assert metrics["num_trades"] == 3  # Only sell trades count


class TestMonthlyReturns:
    def test_monthly_returns_structure(self, profitable_equity):
        monthly = compute_monthly_returns(profitable_equity)
        assert len(monthly) > 0
        assert "year" in monthly[0]
        assert "month" in monthly[0]
        assert "return_pct" in monthly[0]
