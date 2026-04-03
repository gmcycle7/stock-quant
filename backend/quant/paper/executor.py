"""
Paper Trading Order Executor.

WHY THIS EXISTS:
This module simulates executing trades in a paper (fake) portfolio.
It handles the logic of:
1. Getting the current market price
2. Applying simulated slippage
3. Checking if you have enough cash (for buys) or shares (for sells)
4. Updating the portfolio: cash balance, positions, trade history

IMPORTANT: No real money is involved. No broker connection.

MATLAB ANALOGY:
Think of this as updating your workspace variables:
    cash = cash - (shares * price + commission)
    positions(end+1) = struct('symbol', 'AAPL', 'shares', 10, 'price', 150)
"""

import sqlite3
from datetime import datetime


# Simulated costs
COMMISSION_PER_TRADE = 0.0  # Free commissions (like most modern brokers)
SLIPPAGE_PCT = 0.001        # 0.1% slippage simulation


def execute_paper_order(
    db: sqlite3.Connection,
    portfolio_id: int,
    symbol: str,
    side: str,
    quantity: float,
    order_type: str = "market",
    limit_price: float | None = None,
) -> dict:
    """
    Execute a simulated order.

    Args:
        db: Database connection
        portfolio_id: Which paper portfolio
        symbol: Stock ticker
        side: "buy" or "sell"
        quantity: Number of shares
        order_type: "market" or "limit"
        limit_price: Price for limit orders

    Returns:
        Dictionary with order result.
    """
    symbol = symbol.upper()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Get portfolio
    portfolio = db.execute(
        "SELECT * FROM paper_portfolio WHERE id = ?", [portfolio_id]
    ).fetchone()
    if not portfolio:
        return {"status": "error", "message": "Portfolio not found"}

    # Get latest price for the symbol
    price_row = db.execute(
        "SELECT close, date FROM price_data WHERE symbol = ? ORDER BY date DESC LIMIT 1",
        [symbol],
    ).fetchone()
    if not price_row:
        return {"status": "error", "message": f"No price data for {symbol}. Refresh data first."}

    base_price = price_row["close"]

    # For limit orders, check if the limit would be filled
    if order_type == "limit" and limit_price is not None:
        if side == "buy" and base_price > limit_price:
            # Save the order as pending (would not fill at market)
            db.execute(
                """INSERT INTO paper_orders
                   (portfolio_id, symbol, side, order_type, quantity, limit_price, status, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)""",
                [portfolio_id, symbol, side, order_type, quantity, limit_price, now],
            )
            db.commit()
            return {"status": "pending", "message": "Limit buy order placed — price is above limit"}
        elif side == "sell" and base_price < limit_price:
            db.execute(
                """INSERT INTO paper_orders
                   (portfolio_id, symbol, side, order_type, quantity, limit_price, status, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)""",
                [portfolio_id, symbol, side, order_type, quantity, limit_price, now],
            )
            db.commit()
            return {"status": "pending", "message": "Limit sell order placed — price is below limit"}

    # Apply slippage
    if side == "buy":
        fill_price = base_price * (1 + SLIPPAGE_PCT)
    else:
        fill_price = base_price * (1 - SLIPPAGE_PCT)

    commission = COMMISSION_PER_TRADE

    if side == "buy":
        total_cost = fill_price * quantity + commission
        if total_cost > portfolio["cash"]:
            return {
                "status": "error",
                "message": f"Insufficient cash. Need ${total_cost:.2f}, have ${portfolio['cash']:.2f}",
            }

        # Deduct cash
        new_cash = portfolio["cash"] - total_cost
        db.execute(
            "UPDATE paper_portfolio SET cash = ?, updated_at = ? WHERE id = ?",
            [new_cash, now, portfolio_id],
        )

        # Add or update position
        existing = db.execute(
            "SELECT * FROM paper_positions WHERE portfolio_id = ? AND symbol = ?",
            [portfolio_id, symbol],
        ).fetchone()

        if existing:
            # Average up: compute new average entry price
            total_shares = existing["shares"] + quantity
            avg_price = (
                (existing["avg_entry_price"] * existing["shares"])
                + (fill_price * quantity)
            ) / total_shares
            db.execute(
                "UPDATE paper_positions SET shares = ?, avg_entry_price = ? WHERE id = ?",
                [total_shares, avg_price, existing["id"]],
            )
        else:
            db.execute(
                "INSERT INTO paper_positions (portfolio_id, symbol, shares, avg_entry_price) VALUES (?, ?, ?, ?)",
                [portfolio_id, symbol, quantity, fill_price],
            )

        # Record trade
        db.execute(
            """INSERT INTO paper_trades (portfolio_id, symbol, side, shares, price, commission, executed_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            [portfolio_id, symbol, "buy", quantity, fill_price, commission, now],
        )

    elif side == "sell":
        # Check if we have enough shares
        position = db.execute(
            "SELECT * FROM paper_positions WHERE portfolio_id = ? AND symbol = ?",
            [portfolio_id, symbol],
        ).fetchone()

        if not position or position["shares"] < quantity:
            available = position["shares"] if position else 0
            return {
                "status": "error",
                "message": f"Insufficient shares. Have {available}, want to sell {quantity}",
            }

        proceeds = fill_price * quantity - commission
        pnl = (fill_price - position["avg_entry_price"]) * quantity

        # Add cash
        new_cash = portfolio["cash"] + proceeds
        db.execute(
            "UPDATE paper_portfolio SET cash = ?, updated_at = ? WHERE id = ?",
            [new_cash, now, portfolio_id],
        )

        # Update or remove position
        remaining = position["shares"] - quantity
        if remaining <= 0:
            db.execute("DELETE FROM paper_positions WHERE id = ?", [position["id"]])
        else:
            db.execute(
                "UPDATE paper_positions SET shares = ? WHERE id = ?",
                [remaining, position["id"]],
            )

        # Record trade
        db.execute(
            """INSERT INTO paper_trades (portfolio_id, symbol, side, shares, price, commission, pnl, executed_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            [portfolio_id, symbol, "sell", quantity, fill_price, commission, pnl, now],
        )

    else:
        return {"status": "error", "message": f"Invalid side '{side}'. Use 'buy' or 'sell'."}

    # Record order
    db.execute(
        """INSERT INTO paper_orders
           (portfolio_id, symbol, side, order_type, quantity, limit_price, status, filled_price, filled_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'filled', ?, ?, ?)""",
        [portfolio_id, symbol, side, order_type, quantity, limit_price, fill_price, now, now],
    )

    db.commit()

    return {
        "status": "filled",
        "symbol": symbol,
        "side": side,
        "quantity": quantity,
        "fill_price": round(fill_price, 4),
        "commission": round(commission, 2),
        "total_cost": round(fill_price * quantity + commission, 2) if side == "buy" else None,
        "proceeds": round(fill_price * quantity - commission, 2) if side == "sell" else None,
        "pnl": round(pnl, 2) if side == "sell" else None,
    }
