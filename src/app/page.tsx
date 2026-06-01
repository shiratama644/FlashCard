import { StoreProvider } from "@/features/flashcard/state/StoreProvider";
import { App } from "@/features/flashcard/ui/App";

export default function Page() {
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  );
}
