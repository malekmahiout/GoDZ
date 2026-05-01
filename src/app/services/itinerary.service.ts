import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { PlacesService } from './places.service';
import { Place } from '../models/place.model';

export interface ItineraryRequest {
  scope: 'wilaya' | 'radius';
  wilayas: string[];
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  locationLabel?: string;
  days: number;
  interests: string[];
}

export interface ItineraryPlace {
  id?: string | null;
  name: string;
  category: string;
  time: string;
  duration: string;
  tips: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  wilaya: string;
  places: ItineraryPlace[];
  accommodation: string;
  tips: string;
}

export interface Itinerary {
  title: string;
  summary: string;
  totalDays: number;
  days: ItineraryDay[];
}

// ── Créneaux horaires — stockés par ID, traduits à l'affichage ───────────────
export const TIME_SLOTS = [
  { id: 'matin',        labelKey: 'itinerary.ts_matin',        order: 0 },
  { id: 'midi',         labelKey: 'itinerary.ts_midi',         order: 1 },
  { id: 'milieu_apm',   labelKey: 'itinerary.ts_milieu_apm',   order: 2 },
  { id: 'gouter',       labelKey: 'itinerary.ts_gouter',       order: 3 },
  { id: 'debut_soiree', labelKey: 'itinerary.ts_debut_soiree', order: 4 },
  { id: 'fin_soiree',   labelKey: 'itinerary.ts_fin_soiree',   order: 5 },
];

export const TIME_SLOT_ORDER: Record<string, number> = Object.fromEntries(
  TIME_SLOTS.map(s => [s.id, s.order])
);

const MATIN        = TIME_SLOTS[0].id;
const MIDI         = TIME_SLOTS[1].id;
const MILIEU_APM   = TIME_SLOTS[2].id;
const GOUTER       = TIME_SLOTS[3].id;
const DEBUT_SOIREE = TIME_SLOTS[4].id;

const DURATIONS: Record<string, string> = {
  monuments: '2h', culture: '1h30', plages: '3h', montagnes: '3h',
  restaurants: '1h30', salons: '45min', artisanat: '1h30', desert: '2h',
};

const scoreFn = (p: Place) => p.popularity * 0.4 + p.googleRating * 10;

function pick(pool: Place[], idx: number): Place | null {
  return pool.length > 0 ? pool[idx % pool.length] : null;
}

function mkSlot(p: Place, time: string, duration: string): ItineraryPlace {
  return { id: p.id, name: p.nameFr, category: p.category, time, duration, tips: '' };
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable({ providedIn: 'root' })
export class ItineraryService {

  constructor(private places: PlacesService) {}

  generateItinerary(request: ItineraryRequest): Observable<Itinerary> {
    return this.places.getPlaces().pipe(
      take(1),
      map(allPlaces => {
        // Filtrer le pool selon le scope
        let pool: Place[];
        if (request.scope === 'radius' && request.latitude !== undefined && request.longitude !== undefined && request.radiusKm !== undefined) {
          pool = allPlaces.filter(p =>
            haversineKm(request.latitude!, request.longitude!, p.latitude, p.longitude) <= request.radiusKm!
          );
        } else {
          pool = allPlaces.filter(p => request.wilayas.includes(p.wilaya));
        }

        if (pool.length === 0) throw new Error('no_places');

        // Pool restaurants
        const restaurants = [...pool.filter(p => p.category === 'restaurants')]
          .sort((a, b) => scoreFn(b) - scoreFn(a));

        // Pool salons/cafés
        const salons = [...pool.filter(p => p.category === 'salons')]
          .sort((a, b) => scoreFn(b) - scoreFn(a));

        // Pool artisanat — créneau dédié fin d'après-midi
        const artisanat = [...pool.filter(p => p.category === 'artisanat')]
          .sort((a, b) => scoreFn(b) - scoreFn(a));

        // Pool visites (hors restaurants / salons / artisanat)
        const visitCats = request.interests.filter(i => !['restaurants', 'salons', 'artisanat'].includes(i));
        const visits = [...(
          visitCats.length > 0
            ? pool.filter(p => visitCats.includes(p.category))
            : pool.filter(p => !['restaurants', 'salons', 'artisanat'].includes(p.category))
        )].sort((a, b) => scoreFn(b) - scoreFn(a));

        if (restaurants.length === 0 && salons.length === 0 && visits.length === 0) {
          throw new Error('no_places');
        }

        let rIdx = 0, sIdx = 0, vIdx = 0, aIdx = 0;
        const days: ItineraryDay[] = [];

        for (let d = 0; d < request.days; d++) {
          // Structure fixe par journée :
          // ☕ Matin       → café (salon)
          // 🏛️ Matin       → lieu à visiter
          // 🍽️ Midi        → restaurant déjeuner
          // 🏛️ Après-midi  → lieu à visiter
          // 🛍️ Fin ap-midi → commerce artisanal
          // 🍽️ Soirée      → restaurant dîner

          const used: Array<{ place: Place; time: string; duration: string }> = [];
          const add = (p: Place | null, time: string, dur: string) => {
            if (p) used.push({ place: p, time, duration: dur });
          };

          const vm = pick(visits, vIdx++);
          const va = pick(visits, vIdx++);

          add(pick(salons,      sIdx++), MATIN,        '45min');
          add(vm,                        MATIN,        vm ? (DURATIONS[vm.category] ?? '2h') : '2h');
          add(pick(restaurants, rIdx++), MIDI,         '1h30');
          add(va,                        MILIEU_APM,   va ? (DURATIONS[va.category] ?? '2h') : '2h');
          add(pick(artisanat,   aIdx++), GOUTER,       '1h30');
          add(pick(restaurants, rIdx++), DEBUT_SOIREE, '1h30');

          if (used.length === 0) break;

          const wilayasCounted = used.reduce<Record<string, number>>((acc, u) => {
            acc[u.place.wilaya] = (acc[u.place.wilaya] ?? 0) + 1;
            return acc;
          }, {});
          const dayWilaya = Object.entries(wilayasCounted).sort((a, b) => b[1] - a[1])[0]?.[0]
            ?? (request.wilayas[0] ?? '');

          const dayLabel = request.scope === 'radius'
            ? (request.locationLabel ? request.locationLabel.slice(0, 25) : `Rayon ${request.radiusKm} km`)
            : dayWilaya;

          days.push({
            day: d + 1,
            title: `Jour ${d + 1} — ${dayLabel}`,
            description: `${used.length} étapes · du café du matin au dîner`,
            wilaya: dayWilaya,
            places: used.map(u => mkSlot(u.place, u.time, u.duration)),
            accommodation: '',
            tips: '',
          });
        }

        if (days.length === 0) throw new Error('no_places');

        const totalPlaces = days.reduce((s, d) => s + d.places.length, 0);
        const titleLabel = request.scope === 'radius'
          ? (request.locationLabel ? request.locationLabel.slice(0, 30) : `Rayon ${request.radiusKm} km`)
          : request.wilayas.join(' & ');

        return {
          title: `Circuit ${titleLabel}`,
          summary: `${days.length} jour${days.length > 1 ? 's' : ''} · 6 étapes/jour`,
          totalDays: days.length,
          days,
        };
      })
    );
  }
}
