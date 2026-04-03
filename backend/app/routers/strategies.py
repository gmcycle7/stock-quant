"""
Strategies API Router.

Endpoints for listing available strategies, getting their parameters,
and generating trading signals.
"""

from fastapi import APIRouter, Depends, Query
import sqlite3

from database.connection import get_db
from quant.strategies.registry import STRATEGY_REGISTRY, get_strategy_info

router = APIRouter()


@router.get("/list")
def list_strategies():
    """
    List all available trading strategies with their descriptions
    and configurable parameters.
    """
    strategies = []
    for name, info in STRATEGY_REGISTRY.items():
        strategies.append({
            "name": name,
            "display_name": info["display_name"],
            "description": info["description"],
            "parameters": info["parameters"],
            "category": info["category"],
        })
    return {"strategies": strategies}


@router.get("/{strategy_name}")
def get_strategy(strategy_name: str):
    """Get detailed information about a specific strategy."""
    info = get_strategy_info(strategy_name)
    if info is None:
        return {"error": f"Strategy '{strategy_name}' not found"}
    return info


@router.post("/{strategy_name}/signals")
def generate_signals(
    strategy_name: str,
    symbol: str = Query(...),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    params: dict | None = None,
    db: sqlite3.Connection = Depends(get_db),
):
    """
    Generate trading signals for a strategy on given symbol and date range.
    Returns the price data with signal column added.
    """
    import pandas as pd
    from quant.strategies.registry import run_strategy

    # Fetch price data
    query = "SELECT date, open, high, low, close, volume FROM price_data WHERE symbol = ?"
    query_params: list = [symbol.upper()]
    if start_date:
        query += " AND date >= ?"
        query_params.append(start_date)
    if end_date:
        query += " AND date <= ?"
        query_params.append(end_date)
    query += " ORDER BY date ASC"

    cursor = db.execute(query, query_params)
    rows = cursor.fetchall()

    if not rows:
        return {"error": "No price data found for this symbol/date range"}

    df = pd.DataFrame([dict(r) for r in rows])
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date")

    # Run strategy
    result_df = run_strategy(strategy_name, df, params or {})

    result_df = result_df.reset_index()
    result_df["date"] = result_df["date"].dt.strftime("%Y-%m-%d")
    records = result_df.where(result_df.notna(), None).to_dict(orient="records")

    return {
        "strategy": strategy_name,
        "symbol": symbol.upper(),
        "count": len(records),
        "data": records,
    }
