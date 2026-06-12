import type React from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/logo";

/** Sticky top bar for the in-app pages (claimant + firm). The header is a
    direct child of the page's full-height container so `sticky` has room. */
export function AppHeader({
  homeTo = "/",
  label,
  children,
}: {
  homeTo?: string;
  label?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link to={homeTo} className="rounded-md p-1.5 hover:bg-muted">
            <Logo className="h-5" />
          </Link>
          {label && (
            <span className="truncate border-l pl-2 text-sm font-medium text-muted-foreground">{label}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">{children}</div>
      </div>
    </header>
  );
}
