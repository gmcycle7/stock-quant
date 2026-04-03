"""
Market Data API Router.

Endpoints for fetching stock price data, symbols, and indicators.
"""

from fastapi import APIRouter, Depends, Query
import sqlite3

from database.connection import get_db

router = APIRouter()


@router.get("/symbols")
def list_symbols(db: sqlite3.Connection = Depends(get_db)):
    """List all symbols that have cached price data."""
    cursor = db.execute(
        "SELECT DISTINCT symbol FROM price_data ORDER BY symbol"
    )
    symbols = [row["symbol"] for row in cursor.fetchall()]
    return {"symbols": symbols}


@router.get("/prices/{symbol}")
def get_prices(
    symbol: str,
    start_date: str | None = Query(None, description="Start date YYYY-MM-DD"),
    end_date: str | None = Query(None, description="End date YYYY-MM-DD"),
    db: sqlite3.Connection = Depends(get_db),
):
    """Get OHLCV price data for a symbol."""
    query = "SELECT date, open, high, low, close, volume FROM price_data WHERE symbol = ?"
    params: list = [symbol.upper()]

    if start_date:
        query += " AND date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND date <= ?"
        params.append(end_date)

    query += " ORDER BY date ASC"
    cursor = db.execute(query, params)
    rows = cursor.fetchall()

    return {
        "symbol": symbol.upper(),
        "count": len(rows),
        "data": [dict(row) for row in rows],
    }


@router.get("/indicators/{symbol}")
def get_indicators(
    symbol: str,
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    indicators: str = Query("sma_20,ema_20,rsi_14", description="Comma-separated indicator list"),
    db: sqlite3.Connection = Depends(get_db),
):
    """Get price data with computed technical indicators."""
    import pandas as pd
    from quant.indicators.technical import compute_indicators

    # Fetch raw price data
    query = "SELECT date, open, high, low, close, volume FROM price_data WHERE symbol = ?"
    params: list = [symbol.upper()]
    if start_date:
        query += " AND date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND date <= ?"
        params.append(end_date)
    query += " ORDER BY date ASC"

    cursor = db.execute(query, params)
    rows = cursor.fetchall()

    if not rows:
        return {"symbol": symbol.upper(), "count": 0, "data": []}

    # Convert to DataFrame for indicator computation
    df = pd.DataFrame([dict(r) for r in rows])
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date")

    # Compute requested indicators
    indicator_list = [i.strip() for i in indicators.split(",") if i.strip()]
    df = compute_indicators(df, indicator_list)

    # Convert back to records, replacing NaN with None for JSON
    df = df.reset_index()
    df["date"] = df["date"].dt.strftime("%Y-%m-%d")
    records = df.where(df.notna(), None).to_dict(orient="records")

    return {
        "symbol": symbol.upper(),
        "count": len(records),
        "indicators": indicator_list,
        "data": records,
    }


@router.post("/refresh/{symbol}")
def refresh_data(symbol: str, db: sqlite3.Connection = Depends(get_db)):
    """Download/refresh price data for a symbol from the data provider."""
    from quant.data.provider import download_and_cache_symbol

    result = download_and_cache_symbol(symbol.upper(), db)
    return result


@router.get("/metadata")
def get_metadata(db: sqlite3.Connection = Depends(get_db)):
    """Get metadata about cached data (last update times, date ranges)."""
    cursor = db.execute("SELECT * FROM data_metadata ORDER BY symbol")
    rows = cursor.fetchall()
    return {"metadata": [dict(row) for row in rows]}
