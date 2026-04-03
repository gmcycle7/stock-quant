"""
Performance Metrics Module.

WHY THIS EXISTS:
After a backtest, we need to evaluate how well the strategy performed.
Raw profit alone is not enough — we need to understand risk-adjusted
returns, consistency, and worst-case scenarios.

MATLAB ANALOGY:
This is like a collection of functions that take an equity curve vector
and return statistics. In MATLAB you might write:
    sharpe = mean(returns) / std(returns) * sqrt(252);
    maxDD = max(cummax(equity) - equity) / max(cummax(equity));

METRICS COMPUTED:
- Total Return: overall percentage gain/loss
- Annualized Return: return normalized to a yearly basis
- Annualized Volatility: standard deviation of returns, annualized
- Sharpe Ratio: risk-adjusted return (higher is better)
- Sortino Ratio: like Sharpe but only penalizes downside volatility
- Max Drawdown: worst peak-to-trough decline
- Calmar Ratio: return / max drawdown
- Win Rate: percentage of profitable trades
- Average Win / Average Loss
- Profit Factor: gross profit / gross loss
- Number of Trades
- Exposure: percentage of time in the market

All these metrics help answer: "Is this strategy worth trading?"
"""

import pandas as pd
import numpy as np


def compute_metrics(
    equity_series: pd.Series,
    trades: list[dict],
    initial_capital: float = 100000.0,
    risk_free_rate: float = 0.04,  # ~4% annual risk-free rate (US Treasury)
    trading_days_per_year: int = 252,
) -> dict:
    """
    Compute comprehensive performance metrics from backtest results.

    Args:
        equity_series: Series of daily portfolio equity values (DatetimeIndex)
        trades: List of trade dictionaries from the backtester
        initial_capital: Starting capital
        risk_free_rate: Annual risk-free rate for Sharpe/Sortino calculation
        trading_days_per_year: Number of trading days per year (252 for US stocks)

    Returns:
        Dictionary of performance metrics.
    """
    if len(equity_series) < 2:
        return _empty_metrics()

    # ---- Basic return metrics ----
    final_equity = float(equity_series.iloc[-1])
    total_return = ((final_equity - initial_capital) / initial_capital) * 100

    # Daily returns as percentage
    daily_returns = equity_series.pct_change().dropna()

    # Number of trading days
    n_days = len(equity_series)
    n_years = n_days / trading_days_per_year

    # Annualized return
    if n_years > 0 and final_equity > 0 and initial_capital > 0:
        annualized_return = ((final_equity / initial_capital) ** (1 / n_years) - 1) * 100
    else:
        annualized_return = 0.0

    # Annualized volatility
    ann_volatility = float(daily_returns.std() * np.sqrt(trading_days_per_year) * 100)

    # ---- Risk-adjusted returns ----
    # Sharpe Ratio: (return - risk_free) / volatility
    daily_rf = risk_free_rate / trading_days_per_year
    excess_returns = daily_returns - daily_rf
    sharpe_ratio = 0.0
    if len(excess_returns) > 1 and excess_returns.std() > 0:
        sharpe_ratio = float(
            (excess_returns.mean() / excess_returns.std()) * np.sqrt(trading_days_per_year)
        )

    # Sortino Ratio: like Sharpe but only uses downside volatility
    downside_returns = excess_returns[excess_returns < 0]
    sortino_ratio = 0.0
    if len(downside_returns) > 1 and downside_returns.std() > 0:
        sortino_ratio = float(
            (excess_returns.mean() / downside_returns.std()) * np.sqrt(trading_days_per_year)
        )

    # ---- Drawdown analysis ----
    cumulative_max = equity_series.cummax()
    drawdown = (equity_series - cumulative_max) / cumulative_max * 100
    max_drawdown = float(drawdown.min())  # Most negative value

    # Calmar Ratio: annualized return / |max drawdown|
    calmar_ratio = 0.0
    if max_drawdown < 0:
        calmar_ratio = annualized_return / abs(max_drawdown)

    # ---- Trade analysis ----
    sell_trades = [t for t in trades if t["side"] == "sell"]
    n_trades = len(sell_trades)

    winning_trades = [t for t in sell_trades if t.get("pnl", 0) > 0]
    losing_trades = [t for t in sell_trades if t.get("pnl", 0) < 0]

    win_rate = (len(winning_trades) / n_trades * 100) if n_trades > 0 else 0.0

    avg_win = np.mean([t["pnl"] for t in winning_trades]) if winning_trades else 0.0
    avg_loss = np.mean([t["pnl"] for t in losing_trades]) if losing_trades else 0.0
    avg_win_pct = np.mean([t["pnl_pct"] for t in winning_trades]) if winning_trades else 0.0
    avg_loss_pct = np.mean([t["pnl_pct"] for t in losing_trades]) if losing_trades else 0.0

    # Profit factor: gross profit / gross loss
    gross_profit = sum(t["pnl"] for t in winning_trades) if winning_trades else 0.0
    gross_loss = abs(sum(t["pnl"] for t in losing_trades)) if losing_trades else 0.0
    profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else float("inf") if gross_profit > 0 else 0.0

    # Average trade return
    avg_trade_return = np.mean([t["pnl"] for t in sell_trades]) if sell_trades else 0.0
    avg_trade_return_pct = np.mean([t["pnl_pct"] for t in sell_trades]) if sell_trades else 0.0

    # Total commissions
    total_commission = sum(t.get("commission", 0) for t in trades)

    # Exposure: % of days with an open position (approximate)
    # We can estimate this from equity curve — days where equity != cash
    buy_trades = [t for t in trades if t["side"] == "buy"]

    return {
        "total_return": round(total_return, 2),
        "annualized_return": round(annualized_return, 2),
        "annualized_volatility": round(ann_volatility, 2),
        "sharpe_ratio": round(sharpe_ratio, 3),
        "sortino_ratio": round(sortino_ratio, 3),
        "max_drawdown": round(max_drawdown, 2),
        "calmar_ratio": round(calmar_ratio, 3),
        "win_rate": round(win_rate, 1),
        "num_trades": n_trades,
        "num_buys": len(buy_trades),
        "avg_win": round(float(avg_win), 2),
        "avg_loss": round(float(avg_loss), 2),
        "avg_win_pct": round(float(avg_win_pct), 2),
        "avg_loss_pct": round(float(avg_loss_pct), 2),
        "profit_factor": round(profit_factor, 3) if profit_factor != float("inf") else 999.0,
        "avg_trade_return": round(float(avg_trade_return), 2),
        "avg_trade_return_pct": round(float(avg_trade_return_pct), 2),
        "gross_profit": round(gross_profit, 2),
        "gross_loss": round(gross_loss, 2),
        "total_commission": round(total_commission, 2),
        "final_equity": round(final_equity, 2),
        "initial_capital": round(initial_capital, 2),
        "trading_days": n_days,
    }


def _empty_metrics() -> dict:
    """Return a metrics dict with all zeros — used when there's insufficient data."""
    return {
        "total_return": 0,
        "annualized_return": 0,
        "annualized_volatility": 0,
        "sharpe_ratio": 0,
        "sortino_ratio": 0,
        "max_drawdown": 0,
        "calmar_ratio": 0,
        "win_rate": 0,
        "num_trades": 0,
        "num_buys": 0,
        "avg_win": 0,
        "avg_loss": 0,
        "avg_win_pct": 0,
        "avg_loss_pct": 0,
        "profit_factor": 0,
        "avg_trade_return": 0,
        "avg_trade_return_pct": 0,
        "gross_profit": 0,
        "gross_loss": 0,
        "total_commission": 0,
        "final_equity": 0,
        "initial_capital": 0,
        "trading_days": 0,
    }


def compute_monthly_returns(equity_series: pd.Series) -> list[dict]:
    """
    Compute monthly return breakdown for heatmap display.

    Returns:
        List of {year, month, return_pct} records.
    """
    if len(equity_series) < 2:
        return []

    # Resample to monthly, taking the last value of each month
    monthly = equity_series.resample("ME").last()
    monthly_returns = monthly.pct_change().dropna() * 100

    result = []
    for date, ret in monthly_returns.items():
        result.append({
            "year": date.year,
            "month": date.month,
            "return_pct": round(float(ret), 2),
        })
    return result
