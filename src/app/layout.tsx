import type { Metadata, Viewport } from "next";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";
import { notoSansJp, plusJakartaSans } from "./fonts";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Swipe Flashcards App",
};

// <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${plusJakartaSans.variable} ${notoSansJp.variable}`}>
      {/* フォントは next/font で self-host（fonts.ts）。Font Awesome も
          @fortawesome/fontawesome-free を import して self-host（先頭の import 参照）。 */}
      <body className="app-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
