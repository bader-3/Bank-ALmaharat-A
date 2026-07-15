"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconClock, IconSparkle } from "@/components/ui/icons";
import { formatPrice } from "@/lib/wallet/packages";
import type { HourPackage } from "@/types/wallet";
import { cn } from "@/lib/cn";

interface PackageCardProps {
  pkg: HourPackage;
  recommended?: boolean;
  purchasing?: boolean;
  onPurchase: () => void;
}

const PACKAGE_ACCENTS: Record<
  string,
  { card: string; icon: string; badge: "blue" | "sage" | "gold" }
> = {
  explore: {
    card: "border-accent-blue-100/80",
    icon: "bg-accent-blue-100 text-accent-blue-600",
    badge: "blue",
  },
  standard: {
    card: "border-sage-100/80",
    icon: "bg-sage-100 text-sage-700",
    badge: "sage",
  },
  intensive: {
    card: "border-gold-100/80",
    icon: "bg-gold-100 text-gold-700",
    badge: "gold",
  },
};

const DEFAULT_ACCENT = {
  card: "border-border/60",
  icon: "bg-background-subtle text-foreground-muted",
  badge: "sage" as const,
};

export function PackageCard({ pkg, recommended, purchasing, onPurchase }: PackageCardProps) {
  const accent = PACKAGE_ACCENTS[pkg.id] ?? DEFAULT_ACCENT;
  const pricePerHour = Math.round(pkg.price / pkg.hours);

  return (
    <Card
      padding="lg"
      className={cn(
        "relative flex h-full flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        accent.card,
        recommended && "ring-2 ring-sage-400/30",
      )}
    >
      {recommended && (
        <Badge variant="gold" className="absolute -top-3 start-4 shadow-sm">
          <IconSparkle size={12} className="me-1" />
          مقترحة لك
        </Badge>
      )}

      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
            accent.icon,
          )}
        >
          <IconClock size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-navy-900">{pkg.name}</h3>
            <span className="shrink-0 rounded-full bg-background-subtle px-2.5 py-1 text-sm font-bold text-navy-900">
              {pkg.hours} س
            </span>
          </div>
          {pkg.highlight && (
            <Badge variant={accent.badge} className="mt-2">
              {pkg.highlight}
            </Badge>
          )}
        </div>
      </div>

      <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground-secondary">
        {pkg.description}
      </p>

      <div className="mt-6 border-t border-border/50 pt-5">
        <p className="text-2xl font-bold text-navy-900">{formatPrice(pkg.price)}</p>
        <p className="mt-1 text-xs text-foreground-muted">
          {formatPrice(pricePerHour)} للساعة
        </p>

        <Button
          size="lg"
          fullWidth
          className="mt-5"
          disabled={purchasing}
          onClick={onPurchase}
        >
          {purchasing ? "جاري الشراء…" : "اشترِ الباقة"}
        </Button>
      </div>
    </Card>
  );
}
