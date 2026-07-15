import { cn } from "@/lib/cn";
import { type HTMLAttributes } from "react";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "page" | "content" | "prose" | "wide";
}

const sizeStyles = {
  page: "max-w-[72.5rem]",
  content: "max-w-[60rem]",
  prose: "max-w-[35rem]",
  wide: "max-w-[80rem]",
};

export function Container({
  className,
  size = "page",
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-6 lg:px-8", sizeStyles[size], className)}
      {...props}
    >
      {children}
    </div>
  );
}
