"use client";

import { useAuth } from "@/providers/auth-provider";
import { getFavoritesService } from "@/services/favorites";
import { cn } from "@/lib/cn";
import { IconHeart } from "@/components/ui/icons";
import { useCallback, useEffect, useState } from "react";

interface FavoriteButtonProps {
  courseSlug: string;
  className?: string;
  size?: number;
}

export function FavoriteButton({ courseSlug, className, size = 18 }: FavoriteButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const fav = await getFavoritesService().isFavorite(user.id, courseSlug);
    setActive(fav);
  }, [user, courseSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleToggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated || !user) return;
    setLoading(true);
    const next = await getFavoritesService().toggle(user.id, courseSlug);
    setActive(next);
    setLoading(false);
  }

  if (!isAuthenticated) return null;

  return (
    <button
      type="button"
      aria-label={active ? "إزالة من المفضلة" : "إضافة للمفضلة"}
      disabled={loading}
      onClick={(e) => void handleToggle(e)}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
        active
          ? "border-gold-300/60 bg-gold-50 text-gold-600"
          : "border-border-subtle bg-surface text-foreground-muted hover:border-gold-200 hover:text-gold-600",
        className,
      )}
    >
      <IconHeart size={size} filled={active} />
    </button>
  );
}
