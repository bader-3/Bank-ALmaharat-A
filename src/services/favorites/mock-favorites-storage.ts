import { isBrowser } from "@/services/firebase/common";

const FAVORITES_KEY = "asb-favorites";

function readAll(): Record<string, string[]> {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, string[]>) {
  if (!isBrowser()) return;
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(data));
}

export function getFavoriteSlugs(userId: string): string[] {
  return readAll()[userId] ?? [];
}

export function isFavorite(userId: string, courseSlug: string): boolean {
  return getFavoriteSlugs(userId).includes(courseSlug);
}

export function toggleFavorite(userId: string, courseSlug: string): boolean {
  const all = readAll();
  const current = all[userId] ?? [];
  const exists = current.includes(courseSlug);
  const next = exists ? current.filter((s) => s !== courseSlug) : [...current, courseSlug];
  all[userId] = next;
  writeAll(all);
  return !exists;
}

export function removeFavorite(userId: string, courseSlug: string) {
  const all = readAll();
  all[userId] = (all[userId] ?? []).filter((s) => s !== courseSlug);
  writeAll(all);
}
