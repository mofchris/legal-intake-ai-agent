import type React from "react";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

/** Standalone mark (scales of justice). Sized by height via className. */
export const LogoIcon = ({ className, ...props }: React.ComponentProps<"svg">) => (
  <Scale className={cn("text-primary", className)} {...props} />
);

/** Full wordmark: scales icon + "Legal Intake AI". Sized by height via className. */
export const Logo = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    className={cn("inline-flex items-center gap-1.5 font-semibold tracking-tight text-foreground", className)}
    {...props}
  >
    <Scale className="h-full w-auto shrink-0 text-primary" aria-hidden="true" />
    <span className="whitespace-nowrap text-[1.05rem] leading-none">
      Legal Intake<span className="text-primary"> AI</span>
    </span>
  </div>
);
