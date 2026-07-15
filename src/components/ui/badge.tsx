import { cn } from "@/lib/cn";
import { type HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "sage" | "gold" | "navy" | "blue" | "purple" | "orange";
}

const variantStyles = {
  neutral: "bg-background-subtle text-foreground-secondary border-border-subtle",
  sage: "bg-sage-50 text-sage-700 border-sage-200/70 dark:bg-sage-900/20 dark:text-sage-300 dark:border-sage-800/40",
  gold: "bg-gold-50 text-gold-800 border-gold-200/70 dark:bg-gold-900/15 dark:text-gold-300 dark:border-gold-800/35",
  navy: "bg-navy-50 text-navy-800 border-navy-200/70 dark:bg-navy-900/25 dark:text-navy-100 dark:border-navy-800/40",
  blue: "bg-accent-blue-50 text-accent-blue-600 border-accent-blue-100 dark:bg-accent-blue-500/15 dark:text-accent-blue-300 dark:border-accent-blue-500/30",
  purple: "bg-accent-purple-50 text-accent-purple-600 border-accent-purple-100 dark:bg-accent-purple-500/15 dark:text-accent-purple-300 dark:border-accent-purple-500/30",
  orange: "bg-accent-orange-50 text-accent-orange-600 border-accent-orange-100 dark:bg-accent-orange-500/15 dark:text-accent-orange-300 dark:border-accent-orange-500/30",
};

export function Badge({ className, variant = "neutral", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
