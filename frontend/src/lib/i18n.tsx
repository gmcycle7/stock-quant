"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

// ============================================
// 翻譯字典
// ============================================

const translations = {
  en: {
    // -- Nav --
    nav_home: "Home",
    nav_dashboard: "Dashboard",
    nav_market: "Market Data",
    nav_strategies: "Strategies",
    nav_backtest: "Backtest",
    nav_paper: "Paper Trading",
    nav_portfolio: "Portfolio",
    nav_leaderboard: "Leaderboard",
    nav_docs: "Documentation",
    nav_settings: "Settings",
    brand_sub: "Quant Research Platform",
    edu_only: "For Education Only",
    not_advice: "Not financial advice.",

    // -- Disclaimer --
    disclaimer: "This platform is for educational and research purposes only. NOT financial advice. Do NOT trade real money based solely on this system.",
    dismiss: "Dismiss",

    // -- Home --
    home_title: "StockQuant",
    home_subtitle: "Quantitative Trading Research Platform",
    home_desc: "Learn, backtest, and paper trade quantitative strategies — safely and for free.",
    home_warning: "Important: This platform is for educational and research purposes only. It is NOT financial advice. Do not make real investment decisions based solely on this system.",
    feat_market: "Market Data Explorer",
    feat_market_d: "Browse stocks, view prices, and explore technical indicators",
    feat_strategy: "Strategy Library",
    feat_strategy_d: "Browse 5 built-in strategies with configurable parameters",
    feat_backtest: "Strategy Backtest",
    feat_backtest_d: "Test strategies against historical data and analyze performance",
    feat_paper: "Paper Trading",
    feat_paper_d: "Practice trading with simulated money — no risk",
    feat_dashboard: "Dashboard",
    feat_dashboard_d: "Overview of your watchlist, recent backtests, and portfolio",
    feat_docs: "Documentation",
    feat_docs_d: "Learn how every part of the system works",
    quick_start: "Quick Start Guide",
    qs_1: "Explore data:",
    qs_1b: "Go to Market Data",
    qs_2: "Pick a strategy:",
    qs_2b: "Visit the Strategy Library",
    qs_3: "Run a backtest:",
    qs_3b: "Go to Backtest",
    qs_4: "Paper trade:",
    qs_4b: "Use Paper Trading",
    qs_5: "Learn:",
    qs_5b: "Read the Documentation",

    // -- Dashboard --
    dash_title: "Dashboard",
    demo_banner: "Demo Mode — Using built-in sample data. Connect a backend for full functionality.",
    paper_portfolio: "Paper Portfolio",
    total_equity: "Total Equity",
    cash: "Cash",
    positions_val: "Positions",
    total_return: "Total Return",
    watchlist: "Watchlist",
    manage: "Manage",
    no_watchlist: "No symbols in watchlist.",
    add_some: "Add some",
    recent_bt: "Recent Backtests",
    run_new: "Run New",
    no_bt: "No backtests yet.",
    run_first: "Run your first backtest",
    col_strategy: "Strategy",
    col_symbol: "Symbol",
    col_return: "Return",
    col_sharpe: "Sharpe",
    col_maxdd: "Max DD",
    col_trades: "Trades",

    // -- Market --
    mkt_title: "Market Data Explorer",
    mkt_search_ph: "Enter symbol (e.g., AAPL)",
    mkt_refresh: "Refresh Data",
    mkt_refreshing: "Refreshing...",
    mkt_add_wl: "+ Add to Watchlist",
    mkt_rm_wl: "- Remove from Watchlist",
    mkt_price_chart: "Price Chart",
    mkt_loading: "Loading...",
    mkt_recent: "Recent Prices",
    mkt_total_pts: "total data points",
    col_date: "Date",
    col_open: "Open",
    col_high: "High",
    col_low: "Low",
    col_close: "Close",
    col_volume: "Volume",

    // -- Strategies --
    strat_title: "Strategy Library",
    strat_desc: "Browse available trading strategies. Each strategy can be configured with custom parameters and backtested against historical data.",
    strat_params: "Parameters",
    strat_default: "default",
    strat_no_load: "No strategies loaded. Make sure the backend is running.",

    // -- Backtest --
    bt_title: "Strategy Backtest",
    bt_strategy: "Strategy",
    bt_data: "Data",
    bt_start: "Start Date",
    bt_end: "End Date",
    bt_settings: "Settings",
    bt_capital: "Initial Capital ($)",
    bt_commission: "Commission (%)",
    bt_slippage: "Slippage (%)",
    bt_pos_size: "Position Size (%)",
    bt_max_pos: "Max Positions",
    bt_stop_loss: "Stop Loss % (optional)",
    bt_take_profit: "Take Profit % (optional)",
    bt_run: "Run Backtest",
    bt_running: "Running Backtest...",
    bt_placeholder: 'Configure your backtest on the left and click "Run Backtest" to see results here.',
    bt_running_msg: "Running backtest... This may take a few seconds.",
    bt_save_lb: "Save to Leaderboard",
    bt_export_trades: "Export Trades CSV",
    bt_export_equity: "Export Equity CSV",
    bt_export_json: "Export Summary JSON",
    bt_equity_curve: "Equity Curve",
    bt_drawdown: "Drawdown",
    bt_price_signals: "Price Chart with Signals",
    bt_trade_log: "Trade Log",
    bt_trades_count: "trades",
    bt_detail_metrics: "Detailed Metrics",
    col_side: "Side",
    col_price: "Price",
    col_shares: "Shares",
    col_commission: "Commission",
    col_pnl: "P&L",
    col_pnl_pct: "P&L %",
    col_reason: "Reason",
    sharpe_ratio: "Sharpe Ratio",
    max_drawdown: "Max Drawdown",
    win_rate: "Win Rate",
    annual_return: "Annual Return",
    sortino_ratio: "Sortino Ratio",
    profit_factor: "Profit Factor",
    num_trades: "# Trades",

    // -- Paper Trading --
    pt_title: "Paper Trading",
    pt_reset: "Reset Portfolio",
    pt_disclaimer: "This is simulated trading with fake money. No real orders are placed.",
    pt_place_order: "Place Order",
    pt_side: "Side",
    pt_qty: "Quantity (shares)",
    pt_placing: "Placing...",
    pt_open_pos: "Open Positions",
    pt_no_pos: "No open positions",
    pt_trade_hist: "Trade History",
    pt_no_trades: "No trades yet",
    pt_reset_confirm: "Reset portfolio to initial state? All positions and trades will be deleted.",
    pt_reset_ok: "Portfolio reset successfully",

    // -- Portfolio --
    pf_title: "Portfolio",
    pf_initial: "Initial Capital",
    pf_not_found: "Portfolio not found. Make sure the backend is running and data has been seeded.",
    pf_open_pos: "Open Positions",
    col_avg_entry: "Avg Entry",
    col_cur_price: "Current Price",
    col_mkt_val: "Market Value",
    col_unreal_pnl: "Unrealized P&L",

    // -- Leaderboard --
    lb_title: "Leaderboard",
    lb_desc: "Compare saved strategy runs. Sort by different metrics to find the best performers.",
    lb_sort: "Sort by:",
    lb_no_entries: "No entries yet. Run a backtest and save it to the leaderboard.",
    col_name: "Name",
    col_period: "Period",

    // -- Settings --
    set_title: "Settings",
    set_backend: "Backend Connection",
    set_api_url: "API URL",
    set_defaults: "Default Parameters",
    set_future: "Future: Brokerage Integration",
    set_future_desc: "This platform currently supports paper trading only. To add live brokerage integration in the future, you would:",
    set_future_warn: "WARNING: Live trading carries real financial risk. Proceed with extreme caution.",
    set_sys_info: "System Info",

    // -- Docs --
    docs_title: "Documentation",
    docs_desc: "Learn how every part of the StockQuant system works.",

    // -- Common --
    loading: "Loading...",
    symbol: "Symbol",
  },

  zh: {
    // -- Nav --
    nav_home: "首頁",
    nav_dashboard: "儀表板",
    nav_market: "市場數據",
    nav_strategies: "策略庫",
    nav_backtest: "回測",
    nav_paper: "模擬交易",
    nav_portfolio: "投資組合",
    nav_leaderboard: "排行榜",
    nav_docs: "文檔教學",
    nav_settings: "設定",
    brand_sub: "量化交易研究平台",
    edu_only: "僅供教育用途",
    not_advice: "非投資建議。",

    // -- Disclaimer --
    disclaimer: "本平台僅供教育和研究用途，不構成任何投資建議。請勿僅依據本系統進行真實交易。",
    dismiss: "關閉",

    // -- Home --
    home_title: "StockQuant",
    home_subtitle: "量化交易研究平台",
    home_desc: "免費學習、回測和模擬交易量化策略 — 安全無風險。",
    home_warning: "重要提示：本平台僅供教育和研究用途，不構成任何投資建議。請勿僅依據本系統做出真實投資決策。",
    feat_market: "市場數據瀏覽器",
    feat_market_d: "瀏覽股票、查看價格和探索技術指標",
    feat_strategy: "策略庫",
    feat_strategy_d: "瀏覽 5 種內建策略，可自訂參數",
    feat_backtest: "策略回測",
    feat_backtest_d: "用歷史數據測試策略並分析績效",
    feat_paper: "模擬交易",
    feat_paper_d: "用虛擬資金練習交易 — 零風險",
    feat_dashboard: "儀表板",
    feat_dashboard_d: "總覽觀察清單、近期回測和投資組合",
    feat_docs: "文檔教學",
    feat_docs_d: "了解系統每個模組的運作方式",
    quick_start: "快速上手指南",
    qs_1: "瀏覽數據：",
    qs_1b: "前往市場數據",
    qs_2: "選擇策略：",
    qs_2b: "瀏覽策略庫",
    qs_3: "執行回測：",
    qs_3b: "前往回測頁面",
    qs_4: "模擬交易：",
    qs_4b: "使用模擬交易",
    qs_5: "學習：",
    qs_5b: "閱讀文檔教學",

    // -- Dashboard --
    dash_title: "儀表板",
    demo_banner: "展示模式 — 目前使用內建範例資料。連接後端伺服器以獲得完整功能。",
    paper_portfolio: "模擬投資組合",
    total_equity: "總資產",
    cash: "現金",
    positions_val: "持倉市值",
    total_return: "總報酬率",
    watchlist: "觀察清單",
    manage: "管理",
    no_watchlist: "觀察清單為空。",
    add_some: "新增標的",
    recent_bt: "近期回測",
    run_new: "新增回測",
    no_bt: "尚無回測紀錄。",
    run_first: "執行第一次回測",
    col_strategy: "策略",
    col_symbol: "標的",
    col_return: "報酬率",
    col_sharpe: "夏普比率",
    col_maxdd: "最大回撤",
    col_trades: "交易次數",

    // -- Market --
    mkt_title: "市場數據瀏覽器",
    mkt_search_ph: "輸入代碼（如 AAPL）",
    mkt_refresh: "更新數據",
    mkt_refreshing: "更新中...",
    mkt_add_wl: "+ 加入觀察",
    mkt_rm_wl: "- 移除觀察",
    mkt_price_chart: "價格走勢圖",
    mkt_loading: "載入中...",
    mkt_recent: "近期價格",
    mkt_total_pts: "筆資料",
    col_date: "日期",
    col_open: "開盤價",
    col_high: "最高價",
    col_low: "最低價",
    col_close: "收盤價",
    col_volume: "成交量",

    // -- Strategies --
    strat_title: "策略庫",
    strat_desc: "瀏覽可用的交易策略。每個策略都可以自訂參數並對歷史數據進行回測。",
    strat_params: "參數設定",
    strat_default: "預設值",
    strat_no_load: "未載入任何策略。請確認後端伺服器已啟動。",

    // -- Backtest --
    bt_title: "策略回測",
    bt_strategy: "策略",
    bt_data: "數據",
    bt_start: "開始日期",
    bt_end: "結束日期",
    bt_settings: "回測設定",
    bt_capital: "初始資金 ($)",
    bt_commission: "手續費 (%)",
    bt_slippage: "滑點 (%)",
    bt_pos_size: "倉位大小 (%)",
    bt_max_pos: "最大持倉數",
    bt_stop_loss: "止損 %（可選）",
    bt_take_profit: "止盈 %（可選）",
    bt_run: "執行回測",
    bt_running: "回測中...",
    bt_placeholder: "在左側配置回測參數，然後點擊「執行回測」查看結果。",
    bt_running_msg: "正在執行回測...可能需要幾秒鐘。",
    bt_save_lb: "儲存至排行榜",
    bt_export_trades: "匯出交易 CSV",
    bt_export_equity: "匯出權益曲線 CSV",
    bt_export_json: "匯出摘要 JSON",
    bt_equity_curve: "權益曲線",
    bt_drawdown: "回撤曲線",
    bt_price_signals: "價格走勢與訊號",
    bt_trade_log: "交易紀錄",
    bt_trades_count: "筆交易",
    bt_detail_metrics: "詳細績效指標",
    col_side: "方向",
    col_price: "價格",
    col_shares: "股數",
    col_commission: "手續費",
    col_pnl: "損益",
    col_pnl_pct: "損益 %",
    col_reason: "原因",
    sharpe_ratio: "夏普比率",
    max_drawdown: "最大回撤",
    win_rate: "勝率",
    annual_return: "年化報酬",
    sortino_ratio: "索提諾比率",
    profit_factor: "盈虧比",
    num_trades: "交易次數",

    // -- Paper Trading --
    pt_title: "模擬交易",
    pt_reset: "重置組合",
    pt_disclaimer: "這是使用虛擬資金的模擬交易，不會執行真實訂單。",
    pt_place_order: "下單",
    pt_side: "方向",
    pt_qty: "數量（股）",
    pt_placing: "下單中...",
    pt_open_pos: "持倉部位",
    pt_no_pos: "無持倉",
    pt_trade_hist: "交易歷史",
    pt_no_trades: "尚無交易紀錄",
    pt_reset_confirm: "確定要重置投資組合嗎？所有持倉和交易紀錄將被刪除。",
    pt_reset_ok: "投資組合已重置",

    // -- Portfolio --
    pf_title: "投資組合",
    pf_initial: "初始資金",
    pf_not_found: "未找到投資組合。請確認後端伺服器已啟動並已載入種子資料。",
    pf_open_pos: "持倉部位",
    col_avg_entry: "均價",
    col_cur_price: "現價",
    col_mkt_val: "市值",
    col_unreal_pnl: "未實現損益",

    // -- Leaderboard --
    lb_title: "排行榜",
    lb_desc: "比較已儲存的策略回測結果。可按不同指標排序找出最佳策略。",
    lb_sort: "排序：",
    lb_no_entries: "尚無紀錄。執行回測並儲存至排行榜。",
    col_name: "名稱",
    col_period: "期間",

    // -- Settings --
    set_title: "設定",
    set_backend: "後端連線",
    set_api_url: "API 位址",
    set_defaults: "預設參數",
    set_future: "未來：券商 API 整合",
    set_future_desc: "本平台目前僅支援模擬交易。若要整合真實券商 API，您需要：",
    set_future_warn: "警告：真實交易有實際的財務風險。請務必極度謹慎。",
    set_sys_info: "系統資訊",

    // -- Docs --
    docs_title: "文檔教學",
    docs_desc: "了解 StockQuant 系統每個模組的運作方式。",

    // -- Common --
    loading: "載入中...",
    symbol: "標的代碼",
  },
} as const;

export type Lang = keyof typeof translations;
export type TKey = keyof (typeof translations)["en"];

// ============================================
// Context
// ============================================

interface I18nCtx {
  lang: Lang;
  t: (key: TKey) => string;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18nCtx>({
  lang: "en",
  t: (k) => k,
  setLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("sq_lang", l); } catch {}
  }, []);

  // Restore from localStorage on mount
  const t = useCallback(
    (key: TKey): string => {
      return (translations[lang] as Record<string, string>)[key] || (translations.en as Record<string, string>)[key] || key;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, t, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
