import { cn } from "@/lib/cn";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

export interface InputProps extends ComponentPropsWithoutRef<"input"> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const inputId = id ?? label?.replace(/\s+/g, "-").toLowerCase();

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="type-small mb-2 block font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-12 w-full rounded-md border border-border bg-surface px-5",
            "type-body text-foreground placeholder:text-foreground-muted",
            "transition-all duration-200",
            "hover:border-navy-200/60 dark:hover:border-sage-700/50",
            "focus:border-sage-400 focus:outline-none focus:ring-[3px] focus:ring-sage-400/12",
            "disabled:cursor-not-allowed disabled:opacity-40",
            error && "border-red-400/70 focus:border-red-400 focus:ring-red-400/12",
            className,
          )}
          {...props}
        />
        {hint && !error && <p className="type-small mt-2">{hint}</p>}
        {error && <p className="type-small mt-2 text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
