"""
Risk Management Module.

WHY THIS EXISTS:
Risk management is what separates gambling from trading. Without it,
a single bad trade can wipe out all your profits. This module enforces
rules that limit how much you can lose.

KEY RULES:
1. Max position size: Don't put too much money into one stock
2. Stop loss: Automatically sell if price drops X% from entry
3. Take profit: Automatically sell if price rises X% from entry
4. Max drawdown alert: Warn if portfolio is down too much from peak
5. Max concurrent positions: Don't spread too thin
6. Volatility filter: Don't trade when market is too volatile

MATLAB ANALOGY:
Think of these as constraint functions that you check before placing a trade:
    if positionSize > maxAllowed || drawdown > maxDrawdown
        signal = 0;  % cancel the trade
    end
"""

import pandas as pd
import numpy as np
from dataclasses import dataclass


@dataclass
class RiskConfig:
    """Configuration for risk management rules."""
    max_position_size_pct: float = 10.0    # Max % of portfolio per position
    max_concurrent_positions: int = 10
    stop_loss_pct: float | None = 5.0       # Auto-sell if down X%
    take_profit_pct: float | None = 15.0    # Auto-sell if up X%
    max_drawdown_alert_pct: float = 20.0    # Alert threshold
    max_portfolio_risk_pct: float = 30.0    # Max total portfolio risk
    min_cash_reserve_pct: float = 10.0      # Always keep this % in cash
    volatility_lookback: int = 20
    max_volatility_pct: float | None = None  # Skip trades if vol too high


class RiskManager:
    """
    Evaluates risk rules before and after trades.

    Usage:
        risk_mgr = RiskManager(config)
        can_trade, reason = risk_mgr.check_buy(portfolio_state, trade_details)
    """

    def __init__(self, config: RiskConfig | None = None):
        self.config = config or RiskConfig()

    def check_can_buy(
        self,
        cash: float,
        equity: float,
        num_positions: int,
        trade_value: float,
        current_volatility: float | None = None,
    ) -> tuple[bool, str]:
        """
        Check if a buy order is allowed by risk rules.

        Returns:
            (allowed, reason) — True if the trade is allowed, with explanation.
        """
        # Rule 1: Don't exceed max concurrent positions
        if num_positions >= self.config.max_concurrent_positions:
            return False, f"Max positions ({self.config.max_concurrent_positions}) reached"

        # Rule 2: Position size limit
        max_value = equity * (self.config.max_position_size_pct / 100)
        if trade_value > max_value:
            return False, f"Trade value ${trade_value:.0f} exceeds max position size ${max_value:.0f}"

        # Rule 3: Cash reserve
        min_cash = equity * (self.config.min_cash_reserve_pct / 100)
        if cash - trade_value < min_cash:
            return False, f"Would leave less than {self.config.min_cash_reserve_pct}% cash reserve"

        # Rule 4: Volatility filter
        if self.config.max_volatility_pct and current_volatility:
            if current_volatility > self.config.max_volatility_pct:
                return False, f"Current volatility ({current_volatility:.1f}%) exceeds limit ({self.config.max_volatility_pct}%)"

        return True, "Trade allowed"

    def check_drawdown_alert(
        self, equity: float, peak_equity: float
    ) -> tuple[bool, float]:
        """
        Check if the portfolio drawdown has exceeded the alert threshold.

        Returns:
            (is_alert, drawdown_pct)
        """
        if peak_equity <= 0:
            return False, 0.0

        drawdown_pct = ((peak_equity - equity) / peak_equity) * 100
        is_alert = drawdown_pct >= self.config.max_drawdown_alert_pct

        return is_alert, round(drawdown_pct, 2)

    def compute_stop_loss_price(self, entry_price: float) -> float | None:
        """Calculate stop loss price based on entry price."""
        if self.config.stop_loss_pct is None:
            return None
        return entry_price * (1 - self.config.stop_loss_pct / 100)

    def compute_take_profit_price(self, entry_price: float) -> float | None:
        """Calculate take profit price based on entry price."""
        if self.config.take_profit_pct is None:
            return None
        return entry_price * (1 + self.config.take_profit_pct / 100)

    def compute_position_size(
        self,
        equity: float,
        price: float,
    ) -> int:
        """
        Calculate how many shares to buy based on position size limit.

        Returns:
            Number of whole shares to buy.
        """
        max_value = equity * (self.config.max_position_size_pct / 100)
        shares = int(max_value / price)
        return max(shares, 0)

    def get_current_risk_status(
        self,
        cash: float,
        equity: float,
        peak_equity: float,
        num_positions: int,
    ) -> dict:
        """Get a summary of current risk metrics for display."""
        drawdown_alert, drawdown_pct = self.check_drawdown_alert(equity, peak_equity)
        cash_pct = (cash / equity * 100) if equity > 0 else 0

        return {
            "cash_pct": round(cash_pct, 1),
            "num_positions": num_positions,
            "max_positions": self.config.max_concurrent_positions,
            "drawdown_pct": drawdown_pct,
            "drawdown_alert": drawdown_alert,
            "max_drawdown_alert_pct": self.config.max_drawdown_alert_pct,
            "stop_loss_pct": self.config.stop_loss_pct,
            "take_profit_pct": self.config.take_profit_pct,
        }
