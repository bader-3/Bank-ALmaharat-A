import {
  getFavoriteSlugs,
  isFavorite,
  removeFavorite,
  toggleFavorite,
} from "@/services/favorites/mock-favorites-storage";
import { mockWriteDelay } from "@/lib/mock-delay";

export interface FavoritesService {
  list(userId: string): Promise<string[]>;
  isFavorite(userId: string, slug: string): Promise<boolean>;
  toggle(userId: string, slug: string): Promise<boolean>;
  remove(userId: string, slug: string): Promise<void>;
}

export class MockFavoritesService implements FavoritesService {
  async list(userId: string) {
    return getFavoriteSlugs(userId);
  }

  async isFavorite(userId: string, slug: string) {
    return isFavorite(userId, slug);
  }

  async toggle(userId: string, slug: string) {
    await mockWriteDelay(40);
    return toggleFavorite(userId, slug);
  }

  async remove(userId: string, slug: string) {
    removeFavorite(userId, slug);
  }
}

let instance: MockFavoritesService | null = null;

export function getFavoritesService(): FavoritesService {
  if (!instance) instance = new MockFavoritesService();
  return instance;
}
