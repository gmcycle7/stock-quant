"""
Database connection manager for SQLite.

WHY THIS EXISTS:
We need a central place to manage our database connection. SQLite stores
everything in a single file — no server needed. This module handles:
1. Creating the database file if it doesn't exist
2. Running the schema to create tables
3. Providing a connection for other modules to use

MATLAB ANALOGY:
Think of this as your data loading script that sets up your workspace.
Instead of loading .mat files, we're connecting to a .db file that
persists data between sessions.
"""

import sqlite3
import os
from pathlib import Path

# The database file lives in the backend/database/ folder
DATABASE_DIR = Path(__file__).parent
DATABASE_PATH = DATABASE_DIR / "stock_quant.db"
SCHEMA_PATH = DATABASE_DIR / "schema.sql"


def get_connection(db_path: str | None = None) -> sqlite3.Connection:
    """
    Get a SQLite database connection.

    Args:
        db_path: Optional custom path to the database file.
                 If None, uses the default location.

    Returns:
        sqlite3.Connection with row_factory set to sqlite3.Row
        so results behave like dictionaries.
    """
    path = db_path or str(DATABASE_PATH)
    conn = sqlite3.connect(path)
    # This makes rows accessible by column name: row["symbol"] instead of row[0]
    conn.row_factory = sqlite3.Row
    # Enable foreign key enforcement (SQLite has it off by default)
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_database(db_path: str | None = None) -> None:
    """
    Initialize the database by running the schema SQL.
    Safe to call multiple times — uses CREATE IF NOT EXISTS.

    This is like running a setup script at the start of a MATLAB session
    to make sure all your data structures are ready.
    """
    conn = get_connection(db_path)
    try:
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        conn.executescript(schema_sql)
        conn.commit()
    finally:
        conn.close()


def get_db():
    """
    Generator that yields a database connection and ensures it's closed.
    Used as a FastAPI dependency injection.

    Usage in a FastAPI route:
        @router.get("/data")
        def get_data(db = Depends(get_db)):
            cursor = db.execute("SELECT ...")
            ...
    """
    init_database()
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()
