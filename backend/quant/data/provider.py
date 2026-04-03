"""
Market Data Provider Module.

WHY THIS EXISTS:
We need stock price data to test our strategies. This module downloads
historical OHLCV (Open, High, Low, Close, Volume) data from free providers
and caches it in our SQLite database so we don't re-download every time.

MATLAB ANALOGY:
Think of this as a function that either:
1. Loads data from a saved .mat file if it exists, or
2. Downloads it from the internet and saves it for next time.

HOW IT WORKS:
1. User requests data for a symbol (e.g., "AAPL")
2. We check if we already have recent data in SQLite
3. If not, we download from yfinance (Yahoo Finance — free, no API key)
4. We clean the data (handle missing values, ensure correct types)
5. We store it in the price_data table
6. Return a success/failure message

INPUTS:
    - symbol: Stock ticker (e.g., "AAPL", "MSFT", "SPY")
    - db: Database connection
    - period: How far back to download (default "5y" = 5 years)

OUTPUTS:
    - Dictionary with download status, row count, date range

DEPENDENCIES:
    - yfinance: Free Yahoo Finance data provider
    - pandas: Data manipulation
    - sqlite3: Database storage
"""

import sqlite3
from datetime import datetime, timedelta

import pandas as pd
import yfinance as yf


def download_and_cache_symbol(
    symbol: str,
    db: sqlite3.Connection,
    period: str = "5y",
) -> dict:
    """
    Download historical price data for a symbol and cache it in the database.

    This function is idempotent — safe to call multiple times.
    It will update existing data and add new data points.

    Args:
        symbol: Stock ticker symbol (e.g., "AAPL")
        db: SQLite database connection
        period: How far back to fetch. Options: "1y", "2y", "5y", "10y", "max"

    Returns:
        Dict with status, count, and date range information.
    """
    symbol = symbol.upper().strip()

    try:
        # Download from Yahoo Finance
        # yfinance returns a pandas DataFrame with columns:
        # Open, High, Low, Close, Volume (and sometimes Adj Close)
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period)

        if df.empty:
            return {
                "status": "error",
                "symbol": symbol,
                "message": f"No data found for symbol '{symbol}'. Check if it's a valid US ticker.",
            }

        # Clean the data
        df = _clean_price_data(df)

        # Store in database
        rows_inserted = _store_price_data(symbol, df, db)

        # Update metadata
        _update_metadata(symbol, df, db)

        return {
            "status": "success",
            "symbol": symbol,
            "rows": rows_inserted,
            "start_date": df.index[0].strftime("%Y-%m-%d"),
            "end_date": df.index[-1].strftime("%Y-%m-%d"),
            "message": f"Downloaded {rows_inserted} data points for {symbol}",
        }

    except Exception as e:
        return {
            "status": "error",
            "symbol": symbol,
            "message": f"Failed to download data for {symbol}: {str(e)}",
        }


def _clean_price_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean raw price data from the provider.

    Steps:
    1. Ensure index is DatetimeIndex
    2. Keep only OHLCV columns
    3. Drop rows with any NaN values
    4. Ensure all prices are positive
    5. Sort by date ascending

    MATLAB analogy: This is like using rmmissing() and cleaning a timetable.
    """
    # Standardize column names to lowercase
    df.columns = [c.lower().replace(" ", "_") for c in df.columns]

    # Keep only the columns we need
    expected_cols = ["open", "high", "low", "close", "volume"]
    available_cols = [c for c in expected_cols if c in df.columns]
    df = df[available_cols].copy()

    # Remove timezone info if present (simplifies everything)
    if df.index.tz is not None:
        df.index = df.index.tz_localize(None)

    # Drop rows with missing data
    df = df.dropna()

    # Remove rows where price is zero or negative (data errors)
    df = df[(df["close"] > 0) & (df["open"] > 0)]

    # Ensure volume is integer
    df["volume"] = df["volume"].astype(int)

    # Sort by date
    df = df.sort_index()

    return df


def _store_price_data(
    symbol: str, df: pd.DataFrame, db: sqlite3.Connection
) -> int:
    """
    Store price data in the database using INSERT OR REPLACE.
    This updates existing rows and inserts new ones.
    """
    rows_inserted = 0
    for date, row in df.iterrows():
        date_str = date.strftime("%Y-%m-%d")
        db.execute(
            """INSERT OR REPLACE INTO price_data (symbol, date, open, high, low, close, volume)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            [
                symbol,
                date_str,
                round(float(row["open"]), 4),
                round(float(row["high"]), 4),
                round(float(row["low"]), 4),
                round(float(row["close"]), 4),
                int(row["volume"]),
            ],
        )
        rows_inserted += 1
    db.commit()
    return rows_inserted


def _update_metadata(
    symbol: str, df: pd.DataFrame, db: sqlite3.Connection
) -> None:
    """Update the data_metadata table with freshness info."""
    db.execute(
        """INSERT OR REPLACE INTO data_metadata (symbol, last_updated, first_date, last_date, row_count)
           VALUES (?, ?, ?, ?, ?)""",
        [
            symbol,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            df.index[0].strftime("%Y-%m-%d"),
            df.index[-1].strftime("%Y-%m-%d"),
            len(df),
        ],
    )
    db.commit()


def get_cached_symbols(db: sqlite3.Connection) -> list[str]:
    """Get a list of all symbols that have cached data."""
    cursor = db.execute("SELECT DISTINCT symbol FROM price_data ORDER BY symbol")
    return [row[0] for row in cursor.fetchall()]


def get_price_dataframe(
    symbol: str,
    db: sqlite3.Connection,
    start_date: str | None = None,
    end_date: str | None = None,
) -> pd.DataFrame:
    """
    Load cached price data as a pandas DataFrame.

    This is the main way other modules (indicators, strategies, backtester)
    get price data. They never talk to yfinance directly — they always
    go through the cache.

    Returns:
        DataFrame with DatetimeIndex and columns: open, high, low, close, volume
    """
    query = "SELECT date, open, high, low, close, volume FROM price_data WHERE symbol = ?"
    params: list = [symbol.upper()]

    if start_date:
        query += " AND date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND date <= ?"
        params.append(end_date)

    query += " ORDER BY date ASC"

    df = pd.read_sql_query(query, db, parse_dates=["date"], index_col="date")
    return df
