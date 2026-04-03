"""
Seed Data Script — Downloads sample stock data for development.

Run this script once to populate the database with example data:
    cd backend
    python scripts/seed_data.py

WHY THIS EXISTS:
You need data to test strategies. This script downloads historical data
for a set of popular US stocks so you can start experimenting immediately.

The default symbols include:
- Major tech stocks: AAPL, MSFT, GOOGL, AMZN, META, NVDA, TSLA
- Index ETFs: SPY (S&P 500), QQQ (Nasdaq 100)
- Other sectors: JPM (finance), JNJ (healthcare), XOM (energy)
"""

import sys
import os

# Add the backend directory to Python's path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import init_database, get_connection
from quant.data.provider import download_and_cache_symbol

# Default symbols to seed
DEFAULT_SYMBOLS = [
    ("AAPL", "Apple Inc."),
    ("MSFT", "Microsoft Corporation"),
    ("GOOGL", "Alphabet Inc."),
    ("AMZN", "Amazon.com Inc."),
    ("META", "Meta Platforms Inc."),
    ("NVDA", "NVIDIA Corporation"),
    ("TSLA", "Tesla Inc."),
    ("SPY", "SPDR S&P 500 ETF"),
    ("QQQ", "Invesco QQQ Trust"),
    ("JPM", "JPMorgan Chase & Co."),
    ("JNJ", "Johnson & Johnson"),
    ("XOM", "Exxon Mobil Corporation"),
]


def seed():
    """Download data for all default symbols."""
    print("=" * 60)
    print("Stock Quant — Seed Data Script")
    print("=" * 60)
    print()

    # Initialize the database (creates tables if they don't exist)
    init_database()
    db = get_connection()

    print(f"Downloading data for {len(DEFAULT_SYMBOLS)} symbols...")
    print("This may take a minute on first run.\n")

    success_count = 0
    for symbol, name in DEFAULT_SYMBOLS:
        print(f"  Downloading {symbol} ({name})...", end=" ", flush=True)
        result = download_and_cache_symbol(symbol, db, period="5y")

        if result["status"] == "success":
            print(f"OK — {result['rows']} rows ({result['start_date']} to {result['end_date']})")
            success_count += 1

            # Also add to watchlist
            try:
                db.execute(
                    "INSERT OR IGNORE INTO watchlist (symbol, name) VALUES (?, ?)",
                    [symbol, name],
                )
            except Exception:
                pass
        else:
            print(f"FAILED — {result['message']}")

    db.commit()

    # Create a default paper trading portfolio
    existing = db.execute("SELECT id FROM paper_portfolio WHERE id = 1").fetchone()
    if not existing:
        db.execute(
            "INSERT INTO paper_portfolio (name, cash, initial_capital) VALUES (?, ?, ?)",
            ["Default", 100000.0, 100000.0],
        )
        db.commit()
        print("\nCreated default paper trading portfolio with $100,000")

    db.close()

    print(f"\nDone! Downloaded data for {success_count}/{len(DEFAULT_SYMBOLS)} symbols.")
    print("You can now start the backend server:")
    print("  uvicorn app.main:app --reload --port 8000")


if __name__ == "__main__":
    seed()
