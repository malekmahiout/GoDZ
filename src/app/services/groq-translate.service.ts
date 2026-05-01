import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TranslationService, AppLanguage } from './translation.service';
import { Place } from '../models/place.model';
import { environment } from '../../environments/environment';

const LANG_NAMES: Record<AppLanguage, string> = {
  fr: 'français', ar: 'arabe', en: 'anglais', es: 'espagnol', de: 'allemand',
};

@Injectable({ providedIn: 'root' })
export class GroqTranslateService {
  private readonly GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly MODEL = 'llama-3.3-70b-versatile';
  private cache = new Map<string, string>();

  constructor(private http: HttpClient, private translation: TranslationService) {}

  private key(text: string, lang: AppLanguage): string {
    return `${lang}::${text.length}::${text.substring(0, 60)}`;
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${environment.groqApiKey || localStorage.getItem('groq_api_key') || ''}`,
      'Content-Type': 'application/json',
    });
  }

  // Translate a single long text (description)
  translateText(text: string, targetLang: AppLanguage): Observable<string> {
    if (!text || targetLang === 'fr') return of(text);
    const k = this.key(text, targetLang);
    if (this.cache.has(k)) return of(this.cache.get(k)!);

    const prompt = `Traduis ce texte en ${LANG_NAMES[targetLang]}. Réponds UNIQUEMENT avec la traduction, sans commentaire.\n\n${text}`;

    return this.http.post<any>(this.GROQ_API, {
      model: this.MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 2048,
    }, { headers: this.headers() }).pipe(
      map(res => {
        const t = res.choices[0].message.content.trim();
        this.cache.set(k, t);
        return t;
      }),
      catchError(() => of(text))
    );
  }

  // Translate a batch of short texts (reviews) in a single call
  translateBatch(texts: string[], targetLang: AppLanguage): Observable<string[]> {
    if (!texts.length || targetLang === 'fr') return of(texts);

    const uncached: number[] = [];
    const result = [...texts];
    texts.forEach((t, i) => {
      const k = this.key(t, targetLang);
      if (this.cache.has(k)) result[i] = this.cache.get(k)!;
      else uncached.push(i);
    });

    if (!uncached.length) return of(result);

    const toTranslate = uncached.map(i => texts[i]);
    const prompt = `Traduis chaque texte du tableau en ${LANG_NAMES[targetLang]}. Réponds UNIQUEMENT avec un objet JSON {"t":["traduction1","traduction2",...]} dans le même ordre, sans autre texte.\n\n${JSON.stringify(toTranslate)}`;

    return this.http.post<any>(this.GROQ_API, {
      model: this.MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }, { headers: this.headers() }).pipe(
      map(res => {
        const parsed = JSON.parse(res.choices[0].message.content);
        const translations: string[] = parsed.t || toTranslate;
        uncached.forEach((origIdx, i) => {
          const tr = translations[i] ?? texts[origIdx];
          this.cache.set(this.key(texts[origIdx], targetLang), tr);
          result[origIdx] = tr;
        });
        return result;
      }),
      catchError(() => of(texts))
    );
  }

  translatePlaceNames(places: Place[], targetLang: AppLanguage): Observable<void> {
    if (targetLang !== 'es' && targetLang !== 'de') return of(undefined as any);
    const toTranslate = places.filter(p => !this.translation.hasCachedPlaceName(p.id, targetLang));
    if (!toTranslate.length) return of(undefined as any);

    const names = toTranslate.map(p => p.nameEn || p.nameFr);
    const langName = LANG_NAMES[targetLang];
    const prompt = `Traduis ces noms de lieux algériens en ${langName}. Réponds UNIQUEMENT avec un objet JSON {"t":["traduction1","traduction2",...]} dans le même ordre, sans aucun autre texte.\n\n${JSON.stringify(names)}`;

    return this.http.post<any>(this.GROQ_API, {
      model: this.MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    }, { headers: this.headers() }).pipe(
      map(res => {
        const parsed = JSON.parse(res.choices[0].message.content);
        const translations: string[] = parsed.t || [];
        toTranslate.forEach((place, i) => {
          const tr = translations[i];
          if (tr) this.translation.setCachedPlaceName(place.id, targetLang, tr);
        });
      }),
      catchError(() => of(undefined as any))
    );
  }
}
