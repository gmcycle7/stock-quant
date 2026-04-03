import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// GitHub Pages 部署時需要 basePath
// 請將 'stock-quant' 換成你的 GitHub repo 名稱
const repoName = process.env.NEXT_PUBLIC_REPO_NAME || "stock-quant";

const nextConfig: NextConfig = {
  // 靜態匯出 — 產生純 HTML/JS/CSS，可部署到 GitHub Pages
  output: "export",

  // GitHub Pages 需要 basePath（子路徑）
  // 本地開發時不需要
  basePath: isProd ? `/${repoName}` : "",
  assetPrefix: isProd ? `/${repoName}/` : "",

  // 圖片優化在靜態匯出模式下需要關閉
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
