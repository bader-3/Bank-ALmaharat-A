import { cn } from "@/lib/cn";
import { type ReactNode, type SVGProps } from "react";

const ICON_SIZE = 22;
const ICON_STROKE = 1.5;

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function IconBase({ size = ICON_SIZE, className, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={ICON_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

/* ——— Brand ——— */
export function IconLogo({ size = ICON_SIZE, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ——— Directional ——— */
export function IconArrow({ size = 20, ...props }: IconProps) {
  // Points left — the "forward" direction in RTL.
  return (
    <IconBase size={size} {...props}>
      <path d="M19 12H5m0 0l6-6m-6 6l6 6" />
    </IconBase>
  );
}

/* ——— Concept icons ——— */
export function IconClock({ size = ICON_SIZE, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </IconBase>
  );
}

export function IconHourglass({ size = ICON_SIZE, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <path d="M7 4h10M7 20h10" />
      <path d="M8 4c0 4 8 4 8 8s-8 4-8 8" />
      <path d="M16 4c0 4-8 4-8 8s8 4 8 8" />
    </IconBase>
  );
}

export function IconCompass({ size = ICON_SIZE, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15 9l-1.5 4.5L9 15l1.5-4.5L15 9z" />
    </IconBase>
  );
}

export function IconScale({ size = ICON_SIZE, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <path d="M12 4v16M6 20h12" />
      <path d="M12 6l6 2M12 6L6 8" />
      <path d="M4 13l2-5 2 5a2 2 0 01-4 0zM16 11l2-5 2 5a2 2 0 01-4 0z" />
    </IconBase>
  );
}

export function IconSparkle({ size = ICON_SIZE, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <path d="M12 3c.4 3.6 1.4 4.6 5 5-3.6.4-4.6 1.4-5 5-.4-3.6-1.4-4.6-5-5 3.6-.4 4.6-1.4 5-5z" />
      <path d="M18.5 14.5c.2 1.5.6 1.9 2.1 2.1-1.5.2-1.9.6-2.1 2.1-.2-1.5-.6-1.9-2.1-2.1 1.5-.2 1.9-.6 2.1-2.1z" />
    </IconBase>
  );
}

export function IconInfinity({ size = ICON_SIZE, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <path d="M7 9a3 3 0 100 6c2 0 3-2 5-3s3-3 5-3a3 3 0 110 6c-2 0-3-2-5-3S9 9 7 9z" />
    </IconBase>
  );
}

export function IconPath({ size = ICON_SIZE, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M8 6h6a4 4 0 014 4v6" />
    </IconBase>
  );
}

export function IconWallet({ size = ICON_SIZE, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <path d="M4 8.5A2.5 2.5 0 016.5 6H18a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8.5z" />
      <path d="M16 12.5h3v3h-3a1.5 1.5 0 010-3z" />
    </IconBase>
  );
}

export function IconCheck({ size = 18, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <path d="M5 12.5l4 4 10-10" />
    </IconBase>
  );
}

export function IconHeart({ size = 18, filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <IconBase size={size} fill={filled ? "currentColor" : "none"} {...props}>
      <path d="M12 20.5s-7-4.6-7-10a4 4 0 017-2.6A4 4 0 0119 10.5c0 5.4-7 10-7 10z" />
    </IconBase>
  );
}

export function IconUser({ size = ICON_SIZE, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19.5c0-3.5 3-6 7-6s7 2.5 7 6" />
    </IconBase>
  );
}

export function IconUsers({ size = ICON_SIZE, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c0-3 2.5-5 6-5" />
      <circle cx="16" cy="8.5" r="2.5" />
      <path d="M13 19c0-2.5 2-4.5 5-4.5 1.2 0 2.3.4 3.1 1" />
    </IconBase>
  );
}

/* ——— UI controls ——— */
export function IconSun({ size = 20, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4" />
    </IconBase>
  );
}

export function IconMoon({ size = 20, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <path d="M19 13.5A7.5 7.5 0 0110.5 5a7.5 7.5 0 108.5 8.5z" />
    </IconBase>
  );
}

export function IconMenu({ size = 22, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <path d="M4 8h16M4 16h16" />
    </IconBase>
  );
}

export function IconClose({ size = 22, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </IconBase>
  );
}

export function IconPlus({ size = ICON_SIZE, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

export function IconTarget({ size = ICON_SIZE, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconFlame({ size = ICON_SIZE, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <path d="M12 22c4-2.5 6-5.5 6-9.5a6 6 0 00-6-6c-1.5 2-3 3-3 5.5 0-2-1.5-3.5-3-5.5a6 6 0 00-6 6c0 4 2 7 6 9.5z" />
    </IconBase>
  );
}

export function IconBook({ size = ICON_SIZE, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <path d="M5 5.5A2.5 2.5 0 017.5 3H18v16H7.5A2.5 2.5 0 005 16.5V5.5z" />
      <path d="M5 5.5A2.5 2.5 0 017.5 3H18" />
    </IconBase>
  );
}

export function IconFile({ size = ICON_SIZE, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <path d="M8 3h6l4 4v12a2 2 0 01-2 2H8a2 2 0 01-2-2V5a2 2 0 012-2z" />
      <path d="M14 3v4h4" />
    </IconBase>
  );
}
