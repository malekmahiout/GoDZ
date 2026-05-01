import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface FavoriteCollection {
  id: string;
  name: string;
  placeIds: string[];
}

const COLLECTIONS_KEY = 'godz_collections';
const LEGACY_KEY = 'godz_favorites';
const DEFAULT_COLLECTION_ID = 'default';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private collectionsSubject: BehaviorSubject<FavoriteCollection[]>;

  constructor() {
    const collections = this.loadCollections();
    this.collectionsSubject = new BehaviorSubject<FavoriteCollection[]>(collections);
  }

  get collections$(): Observable<FavoriteCollection[]> {
    return this.collectionsSubject.asObservable();
  }

  getCollections(): FavoriteCollection[] {
    return this.collectionsSubject.getValue();
  }

  getDefaultCollection(): FavoriteCollection {
    const cols = this.collectionsSubject.getValue();
    return cols.find(c => c.id === DEFAULT_COLLECTION_ID) ?? cols[0];
  }

  getFavoriteIds(): string[] {
    const all: string[] = [];
    this.getCollections().forEach(c => c.placeIds.forEach((id: string) => {
      if (!all.includes(id)) all.push(id);
    }));
    return all;
  }

  isFavorite(placeId: string): boolean {
    return this.getCollections().some(c => c.placeIds.includes(placeId));
  }

  isInCollection(placeId: string, collectionId: string): boolean {
    return this.getCollections().find(c => c.id === collectionId)?.placeIds.includes(placeId) ?? false;
  }

  addFavorite(placeId: string, collectionId = DEFAULT_COLLECTION_ID): void {
    const cols = this.getCollections().map(c => {
      if (c.id === collectionId && !c.placeIds.includes(placeId)) {
        return { ...c, placeIds: [...c.placeIds, placeId] };
      }
      return c;
    });
    this.update(cols);
  }

  removeFavorite(placeId: string, collectionId?: string): void {
    const cols = this.getCollections().map(c => {
      if (!collectionId || c.id === collectionId) {
        return { ...c, placeIds: c.placeIds.filter(id => id !== placeId) };
      }
      return c;
    });
    this.update(cols);
  }

  toggleFavorite(placeId: string, collectionId = DEFAULT_COLLECTION_ID): boolean {
    if (this.isInCollection(placeId, collectionId)) {
      this.removeFavorite(placeId, collectionId);
      return false;
    } else {
      this.addFavorite(placeId, collectionId);
      return true;
    }
  }

  createCollection(name: string): FavoriteCollection {
    const newCol: FavoriteCollection = {
      id: Date.now().toString(),
      name,
      placeIds: [],
    };
    this.update([...this.getCollections(), newCol]);
    return newCol;
  }

  deleteCollection(collectionId: string): void {
    if (collectionId === DEFAULT_COLLECTION_ID) return;
    this.update(this.getCollections().filter(c => c.id !== collectionId));
  }

  renameCollection(collectionId: string, name: string): void {
    this.update(this.getCollections().map(c => c.id === collectionId ? { ...c, name } : c));
  }

  clearCollection(collectionId: string): void {
    const updated = this.getCollections().map(c =>
      c.id === collectionId ? { ...c, placeIds: [] } : c
    );
    this.update(updated);
  }

  clearAll(): void {
    const cleared = this.getCollections().map(c => ({ ...c, placeIds: [] }));
    this.update(cleared);
  }

  private update(cols: FavoriteCollection[]): void {
    this.collectionsSubject.next(cols);
    this.save(cols);
  }

  private save(cols: FavoriteCollection[]): void {
    try {
      localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(cols));
    } catch { /* ignore */ }
  }

  private loadCollections(): FavoriteCollection[] {
    try {
      const raw = localStorage.getItem(COLLECTIONS_KEY);
      if (raw) return JSON.parse(raw);

      // Migrate from legacy storage
      const legacy = localStorage.getItem(LEGACY_KEY);
      const legacyIds: string[] = legacy ? JSON.parse(legacy) : [];
      const collections: FavoriteCollection[] = [
        { id: DEFAULT_COLLECTION_ID, name: 'Mes Favoris', placeIds: legacyIds }
      ];
      this.save(collections);
      return collections;
    } catch {
      return [{ id: DEFAULT_COLLECTION_ID, name: 'Mes Favoris', placeIds: [] }];
    }
  }
}
