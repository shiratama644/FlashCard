import type { Metadata } from "next";
import "./globals.css";
import { FlashcardProvider } from "@/features/flashcard/context/flashcard-context";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Swipe Flashcards App",
  description: "A modern flashcard app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
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
        <FlashcardProvider>
          <AppShell>{children}</AppShell>
        </FlashcardProvider>
      </body>
    </html>
  );
}
