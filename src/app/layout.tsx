import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientProviders } from "@/components/layout/client-providers";

export const metadata: Metadata = {
  title: "Swipe Flashcards App",
  description: "A modern flashcard app",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// On GitHub Pages (static export) custom HTTP headers are not available, so the
// CSP that next.config.ts normally serves is delivered via a <meta> tag instead.
// (`frame-ancestors`/`X-Frame-Options` cannot be expressed in a meta CSP, so
// clickjacking protection still relies on host-level config when available.)
const isStaticExport = process.env.BUILD_STATIC_EXPORT === "true";
const staticCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
  "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
].join("; ");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {isStaticExport && (
          <>
            <meta httpEquiv="Content-Security-Policy" content={staticCsp} />
            <meta name="referrer" content="strict-origin-when-cross-origin" />
          </>
        )}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=Noto+Sans+JP:wght@400;600;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className="app-body">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
