"""
Backtesting API Router.

Endpoints for running backtests, viewing results, and parameter sweeps.
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
import sqlite3
import json

from database.connection import get_db

router = APIRouter()


class BacktestRequest(BaseModel):
    """Request body for running a backtest."""
    strategy_name: str
    symbol: str
    start_date: str
    end_date: str
    params: dict = {}
    initial_capital: float = 100000.0
    commission_pct: float = 0.001       # 0.1% per trade
    slippage_pct: float = 0.0005        # 0.05% slippage
    position_size_pct: float = 10.0     # 10% of capital per trade
    benchmark_symbol: str = "SPY"       # Benchmark for comparison
    # Risk management
    stop_loss_pct: float | None = None
    take_profit_pct: float | None = None
    max_positions: int = 5


class ParameterSweepRequest(BaseModel):
    """Request body for parameter sweep/grid search."""
    strategy_name: str
    symbol: str
    start_date: str
    end_date: str
    param_grid: dict              # e.g., {"fast_period": [5, 10, 20], "slow_period": [50, 100, 200]}
    initial_capital: float = 100000.0
    commission_pct: float = 0.001
    slippage_pct: float = 0.0005
    position_size_pct: float = 10.0


@router.post("/run")
def run_backtest(req: BacktestRequest, db: sqlite3.Connection = Depends(get_db)):
    """
    Run a backtest for a given strategy, symbol, and date range.
    Returns full results including metrics, equity curve, and trade log.
    """
    import pandas as pd
    from quant.backtest.engine import Backtester
    from quant.strategies.registry import run_strategy

    # Fetch price data
    query = "SELECT date, open, high, low, close, volume FROM price_data WHERE symbol = ? AND date >= ? AND date <= ? ORDER BY date ASC"
    cursor = db.execute(query, [req.symbol.upper(), req.start_date, req.end_date])
    rows = cursor.fetchall()

    if not rows:
        return {"error": "No price data. Please refresh data for this symbol first."}

    df = pd.DataFrame([dict(r) for r in rows])
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date")

    # Generate signals
    signals_df = run_strategy(req.strategy_name, df, req.params)

    # Run backtest
    backtester = Backtester(
        initial_capital=req.initial_capital,
        commission_pct=req.commission_pct,
        slippage_pct=req.slippage_pct,
        position_size_pct=req.position_size_pct,
        stop_loss_pct=req.stop_loss_pct,
        take_profit_pct=req.take_profit_pct,
        max_positions=req.max_positions,
    )
    result = backtester.run(signals_df)

    # Fetch benchmark data for comparison
    benchmark_data = None
    if req.benchmark_symbol:
        bench_cursor = db.execute(
            "SELECT date, close FROM price_data WHERE symbol = ? AND date >= ? AND date <= ? ORDER BY date ASC",
            [req.benchmark_symbol.upper(), req.start_date, req.end_date],
        )
        bench_rows = bench_cursor.fetchall()
        if bench_rows:
            benchmark_data = [dict(r) for r in bench_rows]

    # Save result to database
    db.execute(
        """INSERT INTO backtest_results
           (strategy_name, symbol, params_json, start_date, end_date,
            metrics_json, equity_curve_json, trades_json, initial_capital)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            req.strategy_name,
            req.symbol.upper(),
            json.dumps(req.params),
            req.start_date,
            req.end_date,
            json.dumps(result["metrics"]),
            json.dumps(result["equity_curve"]),
            json.dumps(result["trades"]),
            req.initial_capital,
        ],
    )
    db.commit()

    return {
        "strategy": req.strategy_name,
        "symbol": req.symbol.upper(),
        "params": req.params,
        "metrics": result["metrics"],
        "equity_curve": result["equity_curve"],
        "trades": result["trades"],
        "daily_returns": result.get("daily_returns", []),
        "benchmark": benchmark_data,
    }


@router.post("/sweep")
def parameter_sweep(req: ParameterSweepRequest, db: sqlite3.Connection = Depends(get_db)):
    """
    Run a parameter grid search over a strategy.
    Tests all combinations of parameter values and returns ranked results.
    """
    import pandas as pd
    from itertools import product
    from quant.backtest.engine import Backtester
    from quant.strategies.registry import run_strategy

    # Fetch price data
    cursor = db.execute(
        "SELECT date, open, high, low, close, volume FROM price_data WHERE symbol = ? AND date >= ? AND date <= ? ORDER BY date ASC",
        [req.symbol.upper(), req.start_date, req.end_date],
    )
    rows = cursor.fetchall()
    if not rows:
        return {"error": "No price data found."}

    df = pd.DataFrame([dict(r) for r in rows])
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date")

    # Generate all parameter combinations
    param_names = list(req.param_grid.keys())
    param_values = list(req.param_grid.values())
    combinations = list(product(*param_values))

    results = []
    for combo in combinations:
        params = dict(zip(param_names, combo))
        try:
            signals_df = run_strategy(req.strategy_name, df.copy(), params)
            backtester = Backtester(
                initial_capital=req.initial_capital,
                commission_pct=req.commission_pct,
                slippage_pct=req.slippage_pct,
                position_size_pct=req.position_size_pct,
            )
            result = backtester.run(signals_df)
            results.append({
                "params": params,
                "metrics": result["metrics"],
            })
        except Exception as e:
            results.append({
                "params": params,
                "error": str(e),
            })

    # Sort by Sharpe ratio descending
    valid_results = [r for r in results if "metrics" in r]
    valid_results.sort(key=lambda x: x["metrics"].get("sharpe_ratio", -999), reverse=True)
    error_results = [r for r in results if "error" in r]

    return {
        "strategy": req.strategy_name,
        "symbol": req.symbol.upper(),
        "total_combinations": len(combinations),
        "successful": len(valid_results),
        "failed": len(error_results),
        "results": valid_results + error_results,
    }


@router.get("/history")
def get_backtest_history(
    limit: int = Query(20, ge=1, le=100),
    db: sqlite3.Connection = Depends(get_db),
):
    """Get recent backtest results."""
    cursor = db.execute(
        "SELECT id, strategy_name, symbol, params_json, start_date, end_date, metrics_json, initial_capital, created_at FROM backtest_results ORDER BY created_at DESC LIMIT ?",
        [limit],
    )
    rows = cursor.fetchall()
    results = []
    for row in rows:
        r = dict(row)
        r["params"] = json.loads(r.pop("params_json"))
        r["metrics"] = json.loads(r.pop("metrics_json"))
        results.append(r)
    return {"results": results}


@router.get("/result/{result_id}")
def get_backtest_result(result_id: int, db: sqlite3.Connection = Depends(get_db)):
    """Get a specific saved backtest result by ID."""
    cursor = db.execute("SELECT * FROM backtest_results WHERE id = ?", [result_id])
    row = cursor.fetchone()
    if not row:
        return {"error": "Backtest result not found"}
    r = dict(row)
    r["params"] = json.loads(r.pop("params_json"))
    r["metrics"] = json.loads(r.pop("metrics_json"))
    r["equity_curve"] = json.loads(r.pop("equity_curve_json")) if r.get("equity_curve_json") else []
    r["trades"] = json.loads(r.pop("trades_json")) if r.get("trades_json") else []
    return r
