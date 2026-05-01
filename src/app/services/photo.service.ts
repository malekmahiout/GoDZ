import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Place } from '../models/place.model';


@Injectable({ providedIn: 'root' })
export class PhotoService {
  private photoCache = new Map<string, string[]>();
  private extractCache = new Map<string, string>();

  constructor(private http: HttpClient) {}

  getPhoto(place: Place): Observable<string> {
    return this.getPhotos(place, 1).pipe(map(p => p[0]));
  }

  getPhotos(place: Place, count = 3): Observable<string[]> {
    const key = `${place.id}_${count}`;
    if (this.photoCache.has(key)) {
      return of(this.photoCache.get(key)!);
    }
    return this.tryWikipedia(place.nameFr, 'fr').pipe(
      switchMap(url => url ? of([url]) : this.tryWikipedia(place.nameEn, 'en')),
      switchMap(urls => {
        const arr = Array.isArray(urls) ? urls : (urls ? [urls as string] : []);
        if (arr.length >= count) return of(arr.slice(0, count));
        return this.tryCommons(place, count - arr.length).pipe(
          map(more => [...arr, ...more].slice(0, count))
        );
      }),
      map(urls => {
        const result = urls.length > 0 ? urls : this.fallbacks(place, count);
        this.photoCache.set(key, result);
        return result;
      }),
      catchError(() => {
        const fb = this.fallbacks(place, count);
        this.photoCache.set(key, fb);
        return of(fb);
      })
    );
  }

  getWilayaPhoto(wilaya: string): Observable<string> {
    return this.tryWikipedia(wilaya, 'fr').pipe(
      switchMap(url => url ? of(url) : this.tryWikipedia(wilaya + ' Algeria', 'en')),
      map(url => url || 'assets/photos/theme_monuments.jpg')
    );
  }

  getWikipediaExtract(place: Place): Observable<string> {
    const cacheKey = place.id;
    if (this.extractCache.has(cacheKey)) {
      return of(this.extractCache.get(cacheKey)!);
    }
    return this.tryExtract(place.nameFr, 'fr').pipe(
      switchMap(text => (text && text.length > 80) ? of(text) : this.tryExtract(place.nameEn, 'en')),
      map(text => {
        const result = text || '';
        if (result) this.extractCache.set(cacheKey, result);
        return result;
      }),
      catchError(() => of(''))
    );
  }

  private tryExtract(title: string, lang: string): Observable<string | null> {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    return this.http.get<any>(url).pipe(
      map(d => d?.extract || null),
      catchError(() => of(null))
    );
  }

  private tryWikipedia(title: string, lang: string): Observable<string | null> {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    return this.http.get<any>(url).pipe(
      map(d => {
        const src = d?.originalimage?.source || d?.thumbnail?.source || null;
        if (!src) return null;
        // Skip SVG and TIFF — can't render in img tag
        if (/\.(svg|tif|tiff|ogv|ogg|pdf)$/i.test(src)) return null;
        return src.replace(/\/\d+px-([^/]+)$/, '/800px-$1');
      }),
      catchError(() => of(null))
    );
  }

  private tryCommons(place: Place, count: number): Observable<string[]> {
    const q = encodeURIComponent(`${place.nameFr} ${place.wilaya}`);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=${count * 3}&prop=imageinfo&iiprop=url%7Cmime&iiurlwidth=800&format=json&origin=*`;
    return this.http.get<any>(url).pipe(
      map(data => {
        const pages = data?.query?.pages;
        if (!pages) return [];
        return (Object.values(pages) as any[])
          .filter(p => {
            const mime: string = p?.imageinfo?.[0]?.mime || '';
            return mime.startsWith('image/jpeg') || mime.startsWith('image/png') || mime.startsWith('image/webp');
          })
          .map(p => p?.imageinfo?.[0]?.thumburl || p?.imageinfo?.[0]?.url)
          .filter((u): u is string => !!u)
          .slice(0, count);
      }),
      catchError(() => of([]))
    );
  }

  getWikipediaExtractLang(place: Place, lang: string): Observable<string> {
    const title = lang === 'en' ? place.nameEn : place.nameFr;
    return this.tryExtract(title, lang).pipe(
      map(text => text || ''),
      catchError(() => of(''))
    );
  }

  private fallbacks(place: Place, count: number): string[] {
    const THEME: Record<string, string> = {
      monuments:   'assets/photos/theme_monuments.jpg',
      culture:     'assets/photos/theme_culture.jpg',
      plages:      'assets/photos/theme_plage.jpg',
      montagnes:   'assets/photos/theme_montagne.jpg',
      desert:      'assets/photos/decouvrez_algerie.jpg',
      restaurants: 'assets/photos/theme_restaurant.jpg',
      salons:      'assets/photos/theme_cafe.jpg',
      artisanat:   'assets/photos/artisanat.png',
    };
    const photo = THEME[place.category] || THEME['monuments'];
    return Array.from({ length: count }, () => photo);
  }
}
