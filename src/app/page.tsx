import { StoreProvider } from "@/store/StoreProvider";
import { App } from "@/components/App";

export default function Page() {
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  );
}
