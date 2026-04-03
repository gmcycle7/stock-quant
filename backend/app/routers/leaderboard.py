"""
Leaderboard API Router.

Endpoints for comparing strategy runs and maintaining a leaderboard.
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
import sqlite3

from database.connection import get_db

router = APIRouter()


class LeaderboardEntry(BaseModel):
    """A named strategy run to add to the leaderboard."""
    run_name: str
    strategy_name: str
    symbol: str
    params: dict
    start_date: str
    end_date: str
    total_return: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    num_trades: int


@router.get("/")
def get_leaderboard(
    sort_by: str = Query("sharpe_ratio", description="Sort by: sharpe_ratio, total_return, win_rate, max_drawdown"),
    limit: int = Query(50, ge=1, le=200),
    db: sqlite3.Connection = Depends(get_db),
):
    """Get the leaderboard of strategy runs, sorted by chosen metric."""
    valid_sorts = {"sharpe_ratio", "total_return", "win_rate", "max_drawdown", "num_trades"}
    if sort_by not in valid_sorts:
        sort_by = "sharpe_ratio"

    order = "DESC" if sort_by != "max_drawdown" else "ASC"
    cursor = db.execute(
        f"SELECT * FROM leaderboard ORDER BY {sort_by} {order} LIMIT ?",
        [limit],
    )
    rows = cursor.fetchall()
    return {"leaderboard": [dict(r) for r in rows]}


@router.post("/add")
def add_to_leaderboard(entry: LeaderboardEntry, db: sqlite3.Connection = Depends(get_db)):
    """Add a strategy run to the leaderboard."""
    import json
    db.execute(
        """INSERT INTO leaderboard
           (run_name, strategy_name, symbol, params_json, start_date, end_date,
            total_return, sharpe_ratio, max_drawdown, win_rate, num_trades)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            entry.run_name,
            entry.strategy_name,
            entry.symbol.upper(),
            json.dumps(entry.params),
            entry.start_date,
            entry.end_date,
            entry.total_return,
            entry.sharpe_ratio,
            entry.max_drawdown,
            entry.win_rate,
            entry.num_trades,
        ],
    )
    db.commit()
    return {"message": f"Run '{entry.run_name}' added to leaderboard"}


@router.delete("/{entry_id}")
def remove_from_leaderboard(entry_id: int, db: sqlite3.Connection = Depends(get_db)):
    """Remove an entry from the leaderboard."""
    db.execute("DELETE FROM leaderboard WHERE id = ?", [entry_id])
    db.commit()
    return {"message": "Entry removed"}
