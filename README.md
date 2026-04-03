# StockQuant — 量化交易研究平台

[![CI](https://github.com/YOUR_USERNAME/stock-quant/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/stock-quant/actions/workflows/ci.yml)
[![Deploy](https://github.com/YOUR_USERNAME/stock-quant/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/stock-quant/actions/workflows/deploy.yml)

> **線上 Demo：** [https://YOUR_USERNAME.github.io/stock-quant/](https://YOUR_USERNAME.github.io/stock-quant/)
>
> 上傳到 GitHub 後會自動部署，Demo 頁面使用內建範例資料運行，不需要後端伺服器。

---

> **免責聲明：** 本平台僅供**教育和研究**用途，不構成任何投資建議。
> 過去的績效不代表未來的結果。請勿僅依據本系統進行真實交易。

## 功能特色

- **股票數據瀏覽** — 查看歷史價格、技術指標（SMA, EMA, RSI, MACD, Bollinger Bands, ATR）
- **策略庫** — 5 種內建策略：均線交叉、RSI 均值回歸、布林帶、動量、MACD 趨勢
- **回測引擎** — 支援交易成本、滑點、止損止盈、倉位管理、基準比較（SPY）
- **績效分析** — Sharpe / Sortino / Calmar Ratio、最大回撤、勝率、盈虧比等 20+ 指標
- **模擬交易** — 紙上交易系統，模擬下單、持倉管理、交易歷史
- **參數掃描** — 網格搜索最佳策略參數
- **排行榜** — 比較多次回測結果
- **資料匯出** — 交易紀錄 CSV、權益曲線 CSV、回測摘要 JSON
- **文檔系統** — 內建完整教學文檔，適合初學者
- **Demo Mode** — 無後端也能完整展示（GitHub Pages 靜態部署）

## 系統架構

```
┌─────────────────────┐      HTTP/JSON       ┌──────────────────────┐
│   Next.js Frontend  │ ◄──────────────────► │   FastAPI Backend    │
│   (TypeScript)      │                       │   (Python)           │
│                     │                       │                      │
│ • Dashboard         │                       │ • Market Data        │
│ • Charts (Recharts) │                       │ • Indicators         │
│ • Strategy Builder  │                       │ • Strategies         │
│ • Paper Trading UI  │                       │ • Backtesting        │
│ • Documentation     │                       │ • Analytics          │
│ • Demo Mode         │                       │ • Paper Trading      │
└─────────────────────┘                       │ • Risk Management    │
                                              │ • SQLite Database    │
                                              └──────────────────────┘
```

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端 | Next.js 16 + TypeScript + Tailwind CSS |
| 圖表 | Recharts |
| 後端 | FastAPI (Python) |
| 量化 | pandas, numpy |
| 數據 | Yahoo Finance (yfinance) |
| 資料庫 | SQLite |
| CI/CD | GitHub Actions |
| 部署 | GitHub Pages (前端) |

## 快速開始

### 方式一：純前端 Demo（最簡單）

```bash
cd frontend
npm install
npm run dev
# 開啟 http://localhost:3000
# 自動進入 Demo Mode，使用內建範例資料
```

### 方式二：完整功能（前端 + 後端）

```bash
# 1. 後端
cd backend
pip install -r requirements.txt
python scripts/seed_data.py          # 下載範例股票數據
python -m uvicorn app.main:app --reload --port 8000

# 2. 前端（另開終端）
cd frontend
npm install
npm run dev

# 3. 開啟 http://localhost:3000
```

## 專案結構

```
stock_quant/
├── .github/workflows/       # GitHub Actions (CI + 自動部署)
│   ├── ci.yml               # 自動測試
│   └── deploy.yml           # GitHub Pages 部署
├── backend/                 # Python 後端
│   ├── app/                 # FastAPI 應用
│   │   ├── main.py          # 入口點
│   │   └── routers/         # API 路由 (6 個模組)
│   ├── quant/               # 核心量化庫
│   │   ├── data/            # 市場數據下載與快取
│   │   ├── indicators/      # 技術指標 (SMA, EMA, RSI, MACD, BB, ATR)
│   │   ├── strategies/      # 交易策略 (5 種內建策略)
│   │   ├── backtest/        # 回測引擎
│   │   ├── analytics/       # 績效指標計算
│   │   ├── paper/           # 模擬交易執行器
│   │   └── risk/            # 風險管理
│   ├── database/            # SQLite 資料庫 (8 個表)
│   ├── scripts/             # 種子數據腳本
│   └── tests/               # 測試套件 (46 個測試)
├── frontend/                # Next.js 前端
│   └── src/
│       ├── app/             # 10 個頁面
│       ├── components/      # 可重用元件 (圖表, 卡片等)
│       └── lib/
│           ├── api.ts       # API 客戶端 (自動偵測 Demo Mode)
│           └── demo-data.ts # 內建範例資料
├── .env.example             # 環境變數範本
└── README.md
```

## 頁面一覽

| 頁面 | 路徑 | 說明 |
|------|------|------|
| 首頁 | `/` | 平台介紹和快速導航 |
| Dashboard | `/dashboard` | 總覽：觀察清單、近期回測、投資組合 |
| 市場數據 | `/market` | 股票價格圖表 + 技術指標 |
| 策略庫 | `/strategies` | 瀏覽所有策略的說明和參數 |
| 回測 | `/backtest` | 配置並執行回測，查看結果 |
| 模擬交易 | `/paper-trading` | 模擬下單和持倉管理 |
| 投資組合 | `/portfolio` | 詳細投資組合檢視 |
| 排行榜 | `/leaderboard` | 比較多次策略回測 |
| 文檔 | `/docs` | 完整教學文檔 |
| 設定 | `/settings` | 系統設定和狀態檢查 |

## 部署到 GitHub Pages

1. 在 GitHub 上建立新的 repository
2. Push 程式碼到 `main` 分支
3. 到 **Settings → Pages → Source**，選擇 **GitHub Actions**
4. 等待 Action 完成，你的網站就會部署到 `https://<username>.github.io/<repo-name>/`

## 如何新增策略

1. 在 `backend/quant/strategies/` 新增 Python 檔案
2. 繼承 `BaseStrategy` 並實作 `generate_signals()`
3. 在 `registry.py` 中註冊
4. 完成！新策略會自動出現在前端

詳細教學請參考內建文檔頁面（`/docs`）。

## 測試

```bash
cd backend
python -m pytest tests/ -v
# 46 tests, all passing
```

## 已知限制 & 未來擴充

- **僅支援日線數據**（未來可加入分鐘線）
- **僅支援做多**（未來可加入做空）
- **無實盤交易**（有預留券商 API 整合位置）
- **單一用戶**（無帳號系統）
- **SQLite**（大量數據時可升級為 PostgreSQL）

## License

MIT

---

**記住：** 這是一個教育工具。投資有風險，入市需謹慎。
