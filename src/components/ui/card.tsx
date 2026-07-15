import { cn } from "@/lib/cn";
import { type HTMLAttributes } from "react";

type CardVariant = "default" | "plain" | "tint";
type CardPadding = "sm" | "md" | "lg";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: "surface-content bg-surface border border-border/60 shadow-sm",
  plain: "surface-content bg-surface border border-border-subtle shadow-xs",
  tint: "surface-content border border-sage-200/70 bg-sage-50/55 shadow-sm dark:border-sage-800/40 dark:bg-sage-900/15",
};

const paddingStyles: Record<CardPadding, string> = {
  sm: "p-5",
  md: "p-6 lg:p-7",
  lg: "p-8",
};

export function Card({
  className,
  variant = "default",
  padding = "md",
  interactive = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        variantStyles[variant],
        paddingStyles[padding],
        interactive &&
          "transition-colors duration-200 ease-out hover:border-sage-400 hover:bg-sage-50/25 dark:hover:border-sage-600 dark:hover:bg-sage-900/20",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
