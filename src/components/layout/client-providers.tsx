"use client";

import { FlashcardProvider } from "@/features/flashcard/context/flashcard-context";
import { AppShell } from "@/components/layout/app-shell";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <FlashcardProvider>
      <AppShell>{children}</AppShell>
    </FlashcardProvider>
  );
}
