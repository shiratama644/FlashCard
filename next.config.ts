import type { NextConfig } from "next";

// Static export (GitHub Pages) is enabled via env so local dev/start keep their
// default behaviour (including security headers, which are ignored by `output: export`).
const isStaticExport = process.env.BUILD_STATIC_EXPORT === "true";
const basePath = process.env.BASE_PATH ?? "";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = isStaticExport
  ? {
      reactStrictMode: true,
      output: "export",
      trailingSlash: true,
      images: { unoptimized: true },
      basePath: basePath || undefined,
      assetPrefix: basePath || undefined,
    }
  : {
      reactStrictMode: true,
      headers: async () => [{ source: "/(.*)", headers: securityHeaders }],
    };

export default nextConfig;
