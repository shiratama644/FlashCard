import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-white placeholder:text-white/50 outline-none focus:border-cyan-400",
        className
      )}
      {...props}
    />
  );
}
