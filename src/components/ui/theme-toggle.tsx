"use client";

import { IconMoon, IconSun } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { useTheme } from "@/providers/theme-provider";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-xs transition-colors",
        "hover:border-sage-400/50 hover:bg-surface-elevated",
        className,
      )}
      aria-label={isDark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن"}
    >
      {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
      {showLabel && (isDark ? "الوضع الفاتح" : "الوضع الداكن")}
    </button>
  );
}
