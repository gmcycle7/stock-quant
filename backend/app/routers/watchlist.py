"""
Watchlist API Router.

Endpoints for managing the user's symbol watchlist.
"""

from fastapi import APIRouter, Depends, Query
import sqlite3

from database.connection import get_db

router = APIRouter()


@router.get("/")
def get_watchlist(db: sqlite3.Connection = Depends(get_db)):
    """Get all symbols in the watchlist."""
    cursor = db.execute("SELECT * FROM watchlist ORDER BY added_at DESC")
    items = cursor.fetchall()

    # Enrich with latest price info
    result = []
    for item in items:
        row = dict(item)
        latest = db.execute(
            "SELECT close, date FROM price_data WHERE symbol = ? ORDER BY date DESC LIMIT 1",
            [item["symbol"]],
        ).fetchone()
        if latest:
            row["last_price"] = latest["close"]
            row["last_date"] = latest["date"]

            # Get previous close for daily change
            prev = db.execute(
                "SELECT close FROM price_data WHERE symbol = ? ORDER BY date DESC LIMIT 1 OFFSET 1",
                [item["symbol"]],
            ).fetchone()
            if prev:
                change = latest["close"] - prev["close"]
                change_pct = (change / prev["close"]) * 100
                row["daily_change"] = round(change, 2)
                row["daily_change_pct"] = round(change_pct, 2)
        result.append(row)

    return {"watchlist": result}


@router.post("/add")
def add_to_watchlist(
    symbol: str = Query(...),
    name: str | None = Query(None),
    db: sqlite3.Connection = Depends(get_db),
):
    """Add a symbol to the watchlist."""
    try:
        db.execute(
            "INSERT INTO watchlist (symbol, name) VALUES (?, ?)",
            [symbol.upper(), name],
        )
        db.commit()
        return {"message": f"{symbol.upper()} added to watchlist"}
    except sqlite3.IntegrityError:
        return {"message": f"{symbol.upper()} is already in the watchlist"}


@router.delete("/remove/{symbol}")
def remove_from_watchlist(symbol: str, db: sqlite3.Connection = Depends(get_db)):
    """Remove a symbol from the watchlist."""
    db.execute("DELETE FROM watchlist WHERE symbol = ?", [symbol.upper()])
    db.commit()
    return {"message": f"{symbol.upper()} removed from watchlist"}
