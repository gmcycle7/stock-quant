"""
Paper Trading API Router.

Endpoints for simulated trading — managing portfolios, placing orders,
viewing positions and trade history.

IMPORTANT: This module simulates trading. No real money is involved.
No connection to any brokerage.
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
import sqlite3

from database.connection import get_db

router = APIRouter()


class OrderRequest(BaseModel):
    """Request to place a simulated order."""
    portfolio_id: int = 1
    symbol: str
    side: str          # "buy" or "sell"
    quantity: float
    order_type: str = "market"    # "market" or "limit"
    limit_price: float | None = None


@router.post("/portfolio/create")
def create_portfolio(
    name: str = Query("Default"),
    initial_capital: float = Query(100000.0),
    db: sqlite3.Connection = Depends(get_db),
):
    """Create a new paper trading portfolio."""
    cursor = db.execute(
        "INSERT INTO paper_portfolio (name, cash, initial_capital) VALUES (?, ?, ?)",
        [name, initial_capital, initial_capital],
    )
    db.commit()
    return {"portfolio_id": cursor.lastrowid, "name": name, "cash": initial_capital}


@router.get("/portfolio/{portfolio_id}")
def get_portfolio(portfolio_id: int, db: sqlite3.Connection = Depends(get_db)):
    """Get portfolio summary including cash, positions, and total equity."""
    portfolio = db.execute(
        "SELECT * FROM paper_portfolio WHERE id = ?", [portfolio_id]
    ).fetchone()

    if not portfolio:
        return {"error": "Portfolio not found"}

    positions = db.execute(
        "SELECT * FROM paper_positions WHERE portfolio_id = ?", [portfolio_id]
    ).fetchall()

    # Calculate position values using latest prices
    positions_list = []
    total_positions_value = 0.0
    for pos in positions:
        p = dict(pos)
        # Get latest price for this symbol
        latest = db.execute(
            "SELECT close FROM price_data WHERE symbol = ? ORDER BY date DESC LIMIT 1",
            [pos["symbol"]],
        ).fetchone()
        current_price = latest["close"] if latest else pos["avg_entry_price"]
        market_value = pos["shares"] * current_price
        unrealized_pnl = (current_price - pos["avg_entry_price"]) * pos["shares"]
        p["current_price"] = current_price
        p["market_value"] = round(market_value, 2)
        p["unrealized_pnl"] = round(unrealized_pnl, 2)
        p["unrealized_pnl_pct"] = round(
            (unrealized_pnl / (pos["avg_entry_price"] * pos["shares"])) * 100, 2
        ) if pos["avg_entry_price"] > 0 else 0
        total_positions_value += market_value
        positions_list.append(p)

    cash = portfolio["cash"]
    total_equity = cash + total_positions_value

    return {
        "portfolio_id": portfolio_id,
        "name": portfolio["name"],
        "cash": round(cash, 2),
        "positions_value": round(total_positions_value, 2),
        "total_equity": round(total_equity, 2),
        "initial_capital": portfolio["initial_capital"],
        "total_return_pct": round(
            ((total_equity - portfolio["initial_capital"]) / portfolio["initial_capital"]) * 100, 2
        ),
        "positions": positions_list,
    }


@router.post("/order")
def place_order(order: OrderRequest, db: sqlite3.Connection = Depends(get_db)):
    """
    Place a simulated market or limit order.

    For market orders, fills immediately at the latest known price
    plus simulated slippage.
    """
    from quant.paper.executor import execute_paper_order

    result = execute_paper_order(
        db=db,
        portfolio_id=order.portfolio_id,
        symbol=order.symbol.upper(),
        side=order.side,
        quantity=order.quantity,
        order_type=order.order_type,
        limit_price=order.limit_price,
    )
    return result


@router.get("/positions/{portfolio_id}")
def get_positions(portfolio_id: int, db: sqlite3.Connection = Depends(get_db)):
    """Get all open positions for a portfolio."""
    positions = db.execute(
        "SELECT * FROM paper_positions WHERE portfolio_id = ?", [portfolio_id]
    ).fetchall()
    return {"positions": [dict(p) for p in positions]}


@router.get("/trades/{portfolio_id}")
def get_trades(
    portfolio_id: int,
    limit: int = Query(50, ge=1, le=500),
    db: sqlite3.Connection = Depends(get_db),
):
    """Get trade history for a portfolio."""
    trades = db.execute(
        "SELECT * FROM paper_trades WHERE portfolio_id = ? ORDER BY executed_at DESC LIMIT ?",
        [portfolio_id, limit],
    ).fetchall()
    return {"trades": [dict(t) for t in trades]}


@router.get("/orders/{portfolio_id}")
def get_orders(
    portfolio_id: int,
    limit: int = Query(50, ge=1, le=500),
    db: sqlite3.Connection = Depends(get_db),
):
    """Get order history for a portfolio."""
    orders = db.execute(
        "SELECT * FROM paper_orders WHERE portfolio_id = ? ORDER BY created_at DESC LIMIT ?",
        [portfolio_id, limit],
    ).fetchall()
    return {"orders": [dict(o) for o in orders]}


@router.get("/equity/{portfolio_id}")
def get_equity_history(portfolio_id: int, db: sqlite3.Connection = Depends(get_db)):
    """Get equity history for charting the portfolio equity curve."""
    rows = db.execute(
        "SELECT * FROM paper_equity_history WHERE portfolio_id = ? ORDER BY date ASC",
        [portfolio_id],
    ).fetchall()
    return {"equity_history": [dict(r) for r in rows]}


@router.post("/portfolio/{portfolio_id}/reset")
def reset_portfolio(portfolio_id: int, db: sqlite3.Connection = Depends(get_db)):
    """Reset a paper portfolio to its initial state. Deletes all positions, orders, and trades."""
    portfolio = db.execute(
        "SELECT initial_capital FROM paper_portfolio WHERE id = ?", [portfolio_id]
    ).fetchone()
    if not portfolio:
        return {"error": "Portfolio not found"}

    db.execute("DELETE FROM paper_positions WHERE portfolio_id = ?", [portfolio_id])
    db.execute("DELETE FROM paper_orders WHERE portfolio_id = ?", [portfolio_id])
    db.execute("DELETE FROM paper_trades WHERE portfolio_id = ?", [portfolio_id])
    db.execute("DELETE FROM paper_equity_history WHERE portfolio_id = ?", [portfolio_id])
    db.execute(
        "UPDATE paper_portfolio SET cash = initial_capital, updated_at = datetime('now') WHERE id = ?",
        [portfolio_id],
    )
    db.commit()

    return {"message": "Portfolio reset successfully", "cash": portfolio["initial_capital"]}
