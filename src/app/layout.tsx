import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flashcard App",
  description: "Next.js + TypeScript flashcard app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
