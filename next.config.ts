import type { NextConfig } from "next";

// 静的エクスポート (GitHub Pages 向け) は環境変数で切り替え
// ローカルの dev/start ではセキュリティヘッダを有効化したい (output: export では無視されるため)
const isStaticExport = process.env.BUILD_STATIC_EXPORT === "true";
const basePath = process.env.BASE_PATH ?? "";

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
      // フォントは next/font で self-host('self')。Font Awesome のみ cdnjs を許可。
      "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
      "font-src 'self' https://cdnjs.cloudflare.com data:",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  ...(isStaticExport && {
    output: "export",
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
    basePath: basePath || undefined,
    assetPrefix: basePath || undefined,
  }),

  ...(!isStaticExport && {
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: securityHeaders,
        },
      ];
    },
  }),
};

export default nextConfig;