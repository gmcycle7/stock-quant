"""
Backtesting Engine.

WHY THIS EXISTS:
A backtest simulates what would have happened if you had traded a strategy
over historical data. This is how quantitative traders evaluate strategies
BEFORE risking real money.

MATLAB ANALOGY:
Imagine a for-loop that steps through each day of historical data:
    for t = 1:length(dates)
        if signal(t) == 1
            buy shares at close(t)
        elseif signal(t) == -1
            sell shares at close(t)
        end
        portfolio_value(t) = cash + shares * close(t)
    end

HOW IT WORKS:
1. Takes a DataFrame with price data and a 'signal' column
2. Steps through each day chronologically
3. When signal=1: buys shares (if we have cash and risk rules allow)
4. When signal=-1: sells all shares in that position
5. Applies transaction costs and slippage to each trade
6. Checks risk management rules (stop loss, take profit, max positions)
7. Records every trade and daily portfolio value
8. Returns complete results for analysis

KEY CONCEPTS:
- Equity: total value = cash + market value of all positions
- Drawdown: how far equity has fallen from its peak
- Slippage: the difference between expected and actual execution price
- Commission: broker fee per trade
- Position sizing: how many shares to buy (% of portfolio)

INPUTS:
    - signals_df: DataFrame with OHLCV + signal column
    - Configuration: initial capital, costs, risk limits

OUTPUTS:
    - metrics: dictionary of performance statistics
    - equity_curve: list of {date, equity} for charting
    - trades: list of trade records
    - daily_returns: list of daily return percentages
"""

import pandas as pd
import numpy as np
from dataclasses import dataclass, field


@dataclass
class Position:
    """Represents an open position in a stock."""
    symbol: str
    shares: float
    entry_price: float
    entry_date: str
    stop_loss_price: float | None = None
    take_profit_price: float | None = None


class Backtester:
    """
    Event-driven backtesting engine.

    "Event-driven" means we process each day one at a time, in order.
    We never peek into the future — the backtester only sees data
    up to the current day, just like real trading.
    """

    def __init__(
        self,
        initial_capital: float = 100000.0,
        commission_pct: float = 0.001,     # 0.1% per trade
        slippage_pct: float = 0.0005,      # 0.05% slippage
        position_size_pct: float = 10.0,   # % of equity per position
        stop_loss_pct: float | None = None,
        take_profit_pct: float | None = None,
        max_positions: int = 5,
    ):
        self.initial_capital = initial_capital
        self.commission_pct = commission_pct
        self.slippage_pct = slippage_pct
        self.position_size_pct = position_size_pct
        self.stop_loss_pct = stop_loss_pct
        self.take_profit_pct = take_profit_pct
        self.max_positions = max_positions

    def run(self, df: pd.DataFrame) -> dict:
        """
        Run the backtest on a DataFrame that has a 'signal' column.

        Args:
            df: DataFrame with DatetimeIndex, OHLCV columns, and 'signal' column.
                signal: 1=buy, -1=sell, 0=hold

        Returns:
            Dictionary with keys:
                - metrics: performance statistics
                - equity_curve: [{date, equity}, ...]
                - trades: [{date, side, price, shares, pnl, ...}, ...]
                - daily_returns: [{date, return_pct}, ...]
        """
        if "signal" not in df.columns:
            raise ValueError("DataFrame must have a 'signal' column")

        # State variables
        cash = self.initial_capital
        positions: list[Position] = []  # Currently open positions
        trades: list[dict] = []         # Completed trade records
        equity_curve: list[dict] = []   # Daily equity snapshots
        daily_returns: list[dict] = []

        prev_equity = self.initial_capital

        # Step through each day
        for date, row in df.iterrows():
            date_str = date.strftime("%Y-%m-%d") if hasattr(date, "strftime") else str(date)
            close_price = float(row["close"])
            signal = int(row.get("signal", 0))

            # ----- Check stop loss / take profit on open positions -----
            positions_to_close = []
            for pos in positions:
                if self.stop_loss_pct and close_price <= pos.stop_loss_price:
                    positions_to_close.append((pos, "stop_loss"))
                elif self.take_profit_pct and close_price >= pos.take_profit_price:
                    positions_to_close.append((pos, "take_profit"))

            for pos, reason in positions_to_close:
                sell_price = self._apply_slippage(close_price, "sell")
                commission = sell_price * pos.shares * self.commission_pct
                proceeds = sell_price * pos.shares - commission
                pnl = proceeds - (pos.entry_price * pos.shares)

                trades.append({
                    "date": date_str,
                    "side": "sell",
                    "price": round(sell_price, 4),
                    "shares": pos.shares,
                    "commission": round(commission, 2),
                    "pnl": round(pnl, 2),
                    "pnl_pct": round((pnl / (pos.entry_price * pos.shares)) * 100, 2),
                    "reason": reason,
                    "entry_date": pos.entry_date,
                    "entry_price": pos.entry_price,
                })

                cash += proceeds
                positions.remove(pos)

            # ----- Process signals -----
            if signal == 1 and len(positions) < self.max_positions:
                # BUY: calculate position size
                equity = cash + sum(p.shares * close_price for p in positions)
                position_value = equity * (self.position_size_pct / 100.0)
                buy_price = self._apply_slippage(close_price, "buy")
                shares = int(position_value / buy_price)  # Whole shares only

                if shares > 0 and buy_price * shares <= cash:
                    cost = buy_price * shares
                    commission = cost * self.commission_pct
                    total_cost = cost + commission

                    if total_cost <= cash:
                        # Compute stop/take-profit prices
                        sl_price = None
                        tp_price = None
                        if self.stop_loss_pct:
                            sl_price = buy_price * (1 - self.stop_loss_pct / 100.0)
                        if self.take_profit_pct:
                            tp_price = buy_price * (1 + self.take_profit_pct / 100.0)

                        positions.append(Position(
                            symbol="",  # Single-symbol backtest
                            shares=shares,
                            entry_price=buy_price,
                            entry_date=date_str,
                            stop_loss_price=sl_price,
                            take_profit_price=tp_price,
                        ))

                        cash -= total_cost

                        trades.append({
                            "date": date_str,
                            "side": "buy",
                            "price": round(buy_price, 4),
                            "shares": shares,
                            "commission": round(commission, 2),
                            "pnl": 0,
                            "pnl_pct": 0,
                            "reason": "signal",
                            "entry_date": date_str,
                            "entry_price": round(buy_price, 4),
                        })

            elif signal == -1 and positions:
                # SELL: close all positions
                for pos in list(positions):
                    sell_price = self._apply_slippage(close_price, "sell")
                    commission = sell_price * pos.shares * self.commission_pct
                    proceeds = sell_price * pos.shares - commission
                    pnl = proceeds - (pos.entry_price * pos.shares)

                    trades.append({
                        "date": date_str,
                        "side": "sell",
                        "price": round(sell_price, 4),
                        "shares": pos.shares,
                        "commission": round(commission, 2),
                        "pnl": round(pnl, 2),
                        "pnl_pct": round((pnl / (pos.entry_price * pos.shares)) * 100, 2),
                        "reason": "signal",
                        "entry_date": pos.entry_date,
                        "entry_price": pos.entry_price,
                    })

                    cash += proceeds

                positions.clear()

            # ----- Record daily equity -----
            positions_value = sum(p.shares * close_price for p in positions)
            equity = cash + positions_value

            equity_curve.append({
                "date": date_str,
                "equity": round(equity, 2),
                "cash": round(cash, 2),
                "positions_value": round(positions_value, 2),
            })

            # Daily return
            daily_ret = ((equity - prev_equity) / prev_equity) * 100 if prev_equity > 0 else 0
            daily_returns.append({
                "date": date_str,
                "return_pct": round(daily_ret, 4),
            })
            prev_equity = equity

        # ----- Compute performance metrics -----
        from quant.analytics.metrics import compute_metrics

        equity_series = pd.Series(
            [e["equity"] for e in equity_curve],
            index=pd.to_datetime([e["date"] for e in equity_curve]),
        )

        metrics = compute_metrics(
            equity_series=equity_series,
            trades=trades,
            initial_capital=self.initial_capital,
        )

        return {
            "metrics": metrics,
            "equity_curve": equity_curve,
            "trades": trades,
            "daily_returns": daily_returns,
        }

    def _apply_slippage(self, price: float, side: str) -> float:
        """
        Simulate slippage: buying costs slightly more, selling gives slightly less.

        In real markets, you rarely get the exact price you see. The price moves
        between when you decide to trade and when the order actually executes.
        """
        if side == "buy":
            return price * (1 + self.slippage_pct)
        else:
            return price * (1 - self.slippage_pct)
