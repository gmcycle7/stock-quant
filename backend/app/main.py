"""
FastAPI Application Entry Point.

WHY THIS EXISTS:
This is the "main" of the backend server. When you run:
    uvicorn app.main:app --reload
FastAPI starts a web server that listens for HTTP requests from the frontend.

MATLAB ANALOGY:
Think of this as your main.m script that initializes everything and then
waits for commands. Each API route is like a function that the frontend
can "call" by sending an HTTP request.

HOW IT WORKS:
1. Creates the FastAPI app instance
2. Configures CORS (so the frontend can talk to the backend)
3. Initializes the database
4. Registers all API route groups (routers)
5. Provides a health check endpoint
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.connection import init_database
from app.routers import market_data, strategies, backtest, paper_trading, watchlist, leaderboard

# ============================================
# Create the FastAPI application
# ============================================
app = FastAPI(
    title="Stock Quant API",
    description=(
        "Quantitative trading research platform API. "
        "For educational and research purposes only. "
        "NOT financial advice."
    ),
    version="1.0.0",
)

# ============================================
# CORS Configuration
# ============================================
# CORS = Cross-Origin Resource Sharing.
# The frontend (localhost:3000) and backend (localhost:8000) are on different
# "origins" (different ports). Without CORS, the browser blocks requests
# between them for security. We explicitly allow our frontend origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Next.js dev server
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],              # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],              # Allow all headers
)

# ============================================
# Database Initialization
# ============================================
# Create tables on startup (safe to run multiple times)
@app.on_event("startup")
async def startup():
    init_database()

# ============================================
# Register API Routers
# ============================================
# Each router handles a group of related endpoints.
# The prefix means all routes in that router start with that path.
# Example: market_data router with prefix "/api/market" means
#          GET /api/market/symbols hits the symbols endpoint.
app.include_router(market_data.router, prefix="/api/market", tags=["Market Data"])
app.include_router(strategies.router, prefix="/api/strategies", tags=["Strategies"])
app.include_router(backtest.router, prefix="/api/backtest", tags=["Backtesting"])
app.include_router(paper_trading.router, prefix="/api/paper", tags=["Paper Trading"])
app.include_router(watchlist.router, prefix="/api/watchlist", tags=["Watchlist"])
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["Leaderboard"])

# ============================================
# Health Check
# ============================================
@app.get("/api/health")
def health_check():
    """
    Simple health check endpoint.
    The frontend can ping this to verify the backend is running.
    """
    return {
        "status": "ok",
        "message": "Stock Quant API is running",
        "disclaimer": "This platform is for educational purposes only. Not financial advice.",
    }
