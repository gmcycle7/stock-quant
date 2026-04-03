"""
Tests for the technical indicators module.

These tests verify that our indicator calculations produce correct results
using simple, hand-verifiable inputs.
"""

import pytest
import pandas as pd
import numpy as np
from quant.indicators.technical import (
    compute_sma,
    compute_ema,
    compute_rsi,
    compute_macd,
    compute_bollinger_bands,
    compute_atr,
    compute_indicators,
)


@pytest.fixture
def sample_prices():
    """Create a simple price series for testing."""
    # 30 days of prices that go up, then down, then up
    prices = [100 + i for i in range(15)] + [114 - i for i in range(15)]
    return pd.Series(prices, dtype=float)


@pytest.fixture
def sample_ohlcv():
    """Create a simple OHLCV DataFrame for testing."""
    np.random.seed(42)
    n = 100
    close = 100 + np.cumsum(np.random.randn(n) * 0.5)
    df = pd.DataFrame({
        "open": close + np.random.randn(n) * 0.3,
        "high": close + abs(np.random.randn(n) * 0.5),
        "low": close - abs(np.random.randn(n) * 0.5),
        "close": close,
        "volume": np.random.randint(1000000, 5000000, n),
    }, index=pd.date_range("2023-01-01", periods=n))
    return df


class TestSMA:
    def test_basic_sma(self, sample_prices):
        sma = compute_sma(sample_prices, period=5)
        # First 4 values should be NaN (not enough data)
        assert pd.isna(sma.iloc[0])
        assert pd.isna(sma.iloc[3])
        # Fifth value should be the average of first 5 prices
        expected = np.mean([100, 101, 102, 103, 104])
        assert sma.iloc[4] == pytest.approx(expected)

    def test_sma_length(self, sample_prices):
        sma = compute_sma(sample_prices, period=10)
        assert len(sma) == len(sample_prices)


class TestEMA:
    def test_ema_length(self, sample_prices):
        ema = compute_ema(sample_prices, period=10)
        assert len(ema) == len(sample_prices)

    def test_ema_follows_trend(self, sample_prices):
        ema = compute_ema(sample_prices, period=5)
        # In the upward portion, EMA should be below the price (lagging)
        mid = len(sample_prices) // 2
        assert ema.iloc[mid] < sample_prices.iloc[mid]


class TestRSI:
    def test_rsi_range(self, sample_prices):
        rsi = compute_rsi(sample_prices, period=14)
        valid_rsi = rsi.dropna()
        assert (valid_rsi >= 0).all()
        assert (valid_rsi <= 100).all()

    def test_rsi_length(self, sample_prices):
        rsi = compute_rsi(sample_prices, period=14)
        assert len(rsi) == len(sample_prices)


class TestMACD:
    def test_macd_output_columns(self, sample_prices):
        result = compute_macd(sample_prices)
        assert "macd_line" in result.columns
        assert "macd_signal" in result.columns
        assert "macd_hist" in result.columns

    def test_macd_histogram_is_difference(self, sample_prices):
        result = compute_macd(sample_prices)
        valid = result.dropna()
        diff = valid["macd_line"] - valid["macd_signal"]
        np.testing.assert_array_almost_equal(valid["macd_hist"].values, diff.values, decimal=10)


class TestBollingerBands:
    def test_bb_output_columns(self, sample_prices):
        result = compute_bollinger_bands(sample_prices, period=10)
        assert "bb_upper" in result.columns
        assert "bb_middle" in result.columns
        assert "bb_lower" in result.columns

    def test_bb_upper_above_lower(self, sample_prices):
        result = compute_bollinger_bands(sample_prices, period=10)
        valid = result.dropna()
        assert (valid["bb_upper"] >= valid["bb_lower"]).all()

    def test_bb_middle_is_sma(self, sample_prices):
        result = compute_bollinger_bands(sample_prices, period=10)
        sma = compute_sma(sample_prices, 10)
        valid_idx = result["bb_middle"].dropna().index
        np.testing.assert_array_almost_equal(
            result["bb_middle"].loc[valid_idx].values,
            sma.loc[valid_idx].values,
        )


class TestATR:
    def test_atr_positive(self, sample_ohlcv):
        atr = compute_atr(sample_ohlcv["high"], sample_ohlcv["low"], sample_ohlcv["close"])
        valid = atr.dropna()
        assert (valid > 0).all()


class TestComputeIndicators:
    def test_dispatcher_sma(self, sample_ohlcv):
        result = compute_indicators(sample_ohlcv, ["sma_20"])
        assert "sma_20" in result.columns

    def test_dispatcher_multiple(self, sample_ohlcv):
        result = compute_indicators(sample_ohlcv, ["sma_20", "ema_10", "rsi_14", "macd", "bb_20", "atr_14"])
        assert "sma_20" in result.columns
        assert "ema_10" in result.columns
        assert "rsi_14" in result.columns
        assert "macd_line" in result.columns
        assert "bb_upper" in result.columns
        assert "atr_14" in result.columns
