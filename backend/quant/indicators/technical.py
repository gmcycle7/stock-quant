"""
Technical Indicators Library.

WHY THIS EXISTS:
Technical indicators are mathematical transformations of price data that
traders use to identify patterns, trends, and potential trading signals.
They are the building blocks of quantitative trading strategies.

MATLAB ANALOGY:
Each function here is like a MATLAB function that takes a vector (price series)
and returns a transformed vector. For example:
    sma = movmean(close, 20)  % MATLAB
    sma = compute_sma(close, 20)  % Python equivalent

HOW IT'S ORGANIZED:
- Each indicator is a standalone function that takes a pandas Series/DataFrame
- Functions are pure: no side effects, no database access
- The compute_indicators() function at the bottom is a dispatcher that
  calls the right function based on a string name like "sma_20"

INDICATORS IMPLEMENTED:
1. SMA  — Simple Moving Average (average of last N prices)
2. EMA  — Exponential Moving Average (weighted average, recent prices matter more)
3. RSI  — Relative Strength Index (momentum oscillator, 0-100)
4. MACD — Moving Average Convergence Divergence (trend and momentum)
5. BB   — Bollinger Bands (volatility bands around moving average)
6. ATR  — Average True Range (volatility measure)
"""

import pandas as pd
import numpy as np


# ============================================
# SMA — Simple Moving Average
# ============================================
def compute_sma(close: pd.Series, period: int = 20) -> pd.Series:
    """
    Simple Moving Average: the average of the last `period` closing prices.

    WHAT IT TELLS YOU:
    - If price is above SMA → bullish (uptrend)
    - If price is below SMA → bearish (downtrend)
    - Commonly used periods: 20 (short-term), 50 (medium), 200 (long-term)

    MATH:
        SMA(t) = (Close(t) + Close(t-1) + ... + Close(t-period+1)) / period

    MATLAB equivalent: movmean(close, period)
    """
    return close.rolling(window=period, min_periods=period).mean()


# ============================================
# EMA — Exponential Moving Average
# ============================================
def compute_ema(close: pd.Series, period: int = 20) -> pd.Series:
    """
    Exponential Moving Average: like SMA but gives more weight to recent prices.

    WHAT IT TELLS YOU:
    - Reacts faster to recent price changes than SMA
    - Used in MACD calculation
    - Good for trend-following strategies

    MATH:
        multiplier = 2 / (period + 1)
        EMA(t) = Close(t) * multiplier + EMA(t-1) * (1 - multiplier)

    The first EMA value is the SMA of the first `period` values.
    """
    return close.ewm(span=period, adjust=False).mean()


# ============================================
# RSI — Relative Strength Index
# ============================================
def compute_rsi(close: pd.Series, period: int = 14) -> pd.Series:
    """
    Relative Strength Index: measures the speed and magnitude of price changes.
    Returns values between 0 and 100.

    WHAT IT TELLS YOU:
    - RSI > 70 → overbought (price may be too high, might drop)
    - RSI < 30 → oversold (price may be too low, might rise)
    - RSI around 50 → neutral

    MATH:
        delta = close.diff()
        gain = average of positive deltas over `period`
        loss = average of negative deltas over `period`
        RS = gain / loss
        RSI = 100 - (100 / (1 + RS))
    """
    delta = close.diff()

    # Separate gains and losses
    gain = delta.where(delta > 0, 0.0)
    loss = (-delta).where(delta < 0, 0.0)

    # Use exponential moving average (Wilder's smoothing)
    avg_gain = gain.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()

    # Avoid division by zero
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100.0 - (100.0 / (1.0 + rs))

    return rsi


# ============================================
# MACD — Moving Average Convergence Divergence
# ============================================
def compute_macd(
    close: pd.Series,
    fast_period: int = 12,
    slow_period: int = 26,
    signal_period: int = 9,
) -> pd.DataFrame:
    """
    MACD: shows the relationship between two EMAs of the closing price.

    WHAT IT TELLS YOU:
    - MACD line crosses above signal line → bullish signal (buy)
    - MACD line crosses below signal line → bearish signal (sell)
    - Histogram shows the difference between MACD and signal line

    OUTPUTS (3 columns):
        macd_line:   fast EMA - slow EMA
        macd_signal: EMA of the MACD line
        macd_hist:   macd_line - macd_signal (the histogram)

    MATLAB analogy: Like computing two moving averages and looking at their difference.
    """
    fast_ema = compute_ema(close, fast_period)
    slow_ema = compute_ema(close, slow_period)

    macd_line = fast_ema - slow_ema
    signal_line = macd_line.ewm(span=signal_period, adjust=False).mean()
    histogram = macd_line - signal_line

    return pd.DataFrame({
        "macd_line": macd_line,
        "macd_signal": signal_line,
        "macd_hist": histogram,
    })


# ============================================
# Bollinger Bands
# ============================================
def compute_bollinger_bands(
    close: pd.Series,
    period: int = 20,
    num_std: float = 2.0,
) -> pd.DataFrame:
    """
    Bollinger Bands: a moving average with upper and lower volatility bands.

    WHAT IT TELLS YOU:
    - Price touching upper band → possibly overbought
    - Price touching lower band → possibly oversold
    - Bands narrow → low volatility, breakout may be coming
    - Bands widen → high volatility

    OUTPUTS (3 columns):
        bb_upper: SMA + num_std * standard_deviation
        bb_middle: SMA (the center line)
        bb_lower: SMA - num_std * standard_deviation

    MATLAB analogy: movmean(close, 20) ± 2*movstd(close, 20)
    """
    middle = compute_sma(close, period)
    rolling_std = close.rolling(window=period, min_periods=period).std()

    upper = middle + (num_std * rolling_std)
    lower = middle - (num_std * rolling_std)

    return pd.DataFrame({
        "bb_upper": upper,
        "bb_middle": middle,
        "bb_lower": lower,
    })


# ============================================
# ATR — Average True Range
# ============================================
def compute_atr(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    period: int = 14,
) -> pd.Series:
    """
    Average True Range: measures market volatility.

    WHAT IT TELLS YOU:
    - Higher ATR → more volatile market
    - Lower ATR → calmer market
    - Useful for setting stop-loss distances and position sizing

    MATH:
        True Range = max(high - low, |high - prev_close|, |low - prev_close|)
        ATR = EMA of True Range over `period`
    """
    prev_close = close.shift(1)

    # True Range is the maximum of three values
    tr1 = high - low
    tr2 = (high - prev_close).abs()
    tr3 = (low - prev_close).abs()

    true_range = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)

    atr = true_range.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
    return atr


# ============================================
# Dispatcher: compute indicators by name
# ============================================
def compute_indicators(df: pd.DataFrame, indicator_list: list[str]) -> pd.DataFrame:
    """
    Compute multiple indicators and add them as columns to the DataFrame.

    This is the main entry point used by the API. It parses indicator names
    like "sma_20", "rsi_14", "macd", "bb_20", "atr_14" and calls the
    appropriate function.

    NAMING CONVENTION:
        "indicator_period" → e.g., "sma_20" means SMA with period=20
        Just "indicator" uses default period → e.g., "macd" uses defaults

    Args:
        df: DataFrame with at least a 'close' column (and 'high', 'low' for ATR)
        indicator_list: List of indicator names like ["sma_20", "rsi_14", "macd"]

    Returns:
        DataFrame with new columns added for each indicator.
    """
    result = df.copy()

    for indicator_name in indicator_list:
        parts = indicator_name.lower().split("_")
        ind_type = parts[0]
        period = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else None

        if ind_type == "sma":
            p = period or 20
            result[f"sma_{p}"] = compute_sma(result["close"], p)

        elif ind_type == "ema":
            p = period or 20
            result[f"ema_{p}"] = compute_ema(result["close"], p)

        elif ind_type == "rsi":
            p = period or 14
            result[f"rsi_{p}"] = compute_rsi(result["close"], p)

        elif ind_type == "macd":
            macd_df = compute_macd(result["close"])
            result = pd.concat([result, macd_df], axis=1)

        elif ind_type in ("bb", "bollinger"):
            p = period or 20
            bb_df = compute_bollinger_bands(result["close"], p)
            result = pd.concat([result, bb_df], axis=1)

        elif ind_type == "atr":
            p = period or 14
            if "high" in result.columns and "low" in result.columns:
                result[f"atr_{p}"] = compute_atr(
                    result["high"], result["low"], result["close"], p
                )
            else:
                # Can't compute ATR without high/low data
                result[f"atr_{p}"] = np.nan

    return result
