import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode" title="Toggle dark mode">
      {/* Cross-fades Moon <-> Sun (transitions.dev icon-swap). */}
      <span className="t-icon-swap" data-state={theme === "dark" ? "b" : "a"}>
        <Moon className="t-icon size-4" data-icon="a" />
        <Sun className="t-icon size-4" data-icon="b" />
      </span>
    </Button>
  );
}
