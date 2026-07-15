import { cn } from "@/lib/cn";
import Link from "next/link";
import { forwardRef, type ComponentPropsWithoutRef, type Ref } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type BaseButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

type ButtonAsButton = BaseButtonProps &
  ComponentPropsWithoutRef<"button"> & { href?: undefined };

type ButtonAsLink = BaseButtonProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "bg-navy-900 text-white",
    "shadow-sm",
    "hover:bg-navy-800",
    "dark:bg-navy-800 dark:text-white dark:hover:bg-navy-700",
  ].join(" "),
  secondary: [
    "bg-surface text-foreground",
    "border border-border",
    "shadow-xs",
    "hover:bg-background-subtle hover:border-sage-300",
    "dark:bg-surface dark:text-foreground dark:border-border",
  ].join(" "),
  ghost: [
    "bg-transparent text-foreground-secondary",
    "hover:text-foreground hover:bg-navy-900/[0.04]",
    "dark:hover:bg-white/10 dark:hover:text-foreground",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-10 px-5 text-sm gap-2",
  md: "h-11 px-6 text-sm gap-2",
  lg: "h-12 px-8 text-base gap-2.5",
};

function getButtonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  className?: string,
) {
  return cn(
    "group/btn inline-flex items-center justify-center rounded-xl font-medium",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-40",
    "active:translate-y-0 active:scale-[0.98]",
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && "w-full",
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    const { variant = "primary", size = "md", fullWidth = false, ...rest } = props;
    const { className, children, ...domProps } = rest;
    const classes = getButtonClassName(variant, size, fullWidth, className);

    if ("href" in domProps && domProps.href) {
      const { href, ...linkProps } = domProps as ButtonAsLink;
      return (
        <Link ref={ref as Ref<HTMLAnchorElement>} href={href} className={classes} {...linkProps}>
          {children}
        </Link>
      );
    }

    const { type = "button", ...buttonProps } = domProps as ButtonAsButton;

    return (
      <button ref={ref as Ref<HTMLButtonElement>} type={type} className={classes} {...buttonProps}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
