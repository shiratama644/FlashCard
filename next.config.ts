import type { NextConfig } from "next";

// Vercel（サーバーランタイム）前提の構成。
// 認証 / DB / 決済 / AI 中継などサーバー機能を扱うため、GitHub Pages 向けの
// 静的エクスポート（output: "export"）経路は廃止した。
// セキュリティヘッダはサーバー応答に常時付与する。
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // canvas-confetti は blob: 由来の Worker を生成する（old-site は CSP 無しで動作）。
      // Worker 読み込みを許可し、紙吹雪をコンソール警告なしで old-site と同じ挙動にする。
      "worker-src 'self' blob:",
      // フォント・Font Awesome ともに self-host('self')。外部 CDN は不要。
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
