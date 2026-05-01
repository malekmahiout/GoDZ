import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, ToastController } from '@ionic/angular';
import { Share } from '@capacitor/share';
import { take } from 'rxjs/operators';
import { ItineraryService, Itinerary, ItineraryRequest, ItineraryPlace, TIME_SLOTS, TIME_SLOT_ORDER, haversineKm } from '../../services/itinerary.service';
import { PlacesService } from '../../services/places.service';
import { GeolocationService } from '../../services/geolocation.service';
import { Place } from '../../models/place.model';
import { TranslationService } from '../../services/translation.service';

interface Interest {
  id: string;
  label: string;
  emoji: string;
}

const DURATION_BY_CATEGORY: Record<string, string> = {
  monuments: '2h', culture: '1h30', plages: '3h', montagnes: '3h',
  restaurants: '1h30', salons: '45min', artisanat: '1h30', desert: '2h',
};

type NominatimResult = { display_name: string; lat: string; lon: string };

@Component({
  selector: 'app-itinerary',
  templateUrl: './itinerary.page.html',
  styleUrls: ['./itinerary.page.scss'],
  standalone: false,
})
export class ItineraryPage implements OnInit {

  step = 1;

  // ── Scope : wilaya ou rayon ────────────────────────────────
  scopeMode: 'wilaya' | 'radius' = 'wilaya';

  // Step 1 — Wilayas
  selectedWilayas: string[] = [];

  // Step 1 — Radius
  searchMode: 'geo' | 'address' = 'geo';
  radiusKm = 20;
  readonly radiusPresets = [5, 10, 20, 50];
  userLat: number | null = null;
  userLon: number | null = null;
  locationLabel = '';
  locating = false;
  addressInput = '';
  addressSuggestions: NominatimResult[] = [];
  showSuggestions = false;
  geocoding = false;
  geocodeError = false;
  private suggestTimer: ReturnType<typeof setTimeout> | null = null;

  // Step 2 — Duration + Interests
  days = 1;
  selectedInterests: string[] = ['monuments', 'culture'];

  // Step 3 — Result
  loading = false;
  itinerary: Itinerary | null = null;
  error = '';
  expandedDay: number | null = 0;

  // Edit mode — add place
  addPlaceToDayIndex: number | null = null;
  addPlaceQuery = '';
  searchResults: Place[] = [];
  private allPlaces: Place[] = [];

  readonly wilayas: string[] = [
    'Alger', 'Tizi Ouzou', 'Béjaïa', 'Annaba', 'Oran', 'Tlemcen',
  ];

  readonly interests: Interest[] = [
    { id: 'monuments',   label: '', emoji: '🏛️' },
    { id: 'culture',     label: '', emoji: '🎭' },
    { id: 'plages',      label: '', emoji: '🏖️' },
    { id: 'montagnes',   label: '', emoji: '⛰️' },
    { id: 'restaurants', label: '', emoji: '🍽️' },
    { id: 'salons',      label: '', emoji: '☕' },
    { id: 'artisanat',   label: '', emoji: '🛍️' },
  ];

  constructor(
    private itineraryService: ItineraryService,
    private placesService: PlacesService,
    private geolocationService: GeolocationService,
    private router: Router,
    private toastCtrl: ToastController,
    private actionSheetCtrl: ActionSheetController,
    public t: TranslationService,
  ) {}

  ngOnInit(): void {
    this.placesService.getPlaces().pipe(take(1)).subscribe(places => {
      this.allPlaces = places;
    });
  }

  // ── Wizard ──────────────────────────────────────────────────

  setScopeMode(mode: 'wilaya' | 'radius'): void {
    if (this.scopeMode === mode) return;
    this.scopeMode = mode;
    this.selectedWilayas = [];
    this.userLat = null;
    this.userLon = null;
    this.locationLabel = '';
    this.addressInput = '';
    this.addressSuggestions = [];
    this.geocodeError = false;
  }

  setSearchMode(mode: 'geo' | 'address'): void {
    if (this.searchMode === mode) return;
    this.searchMode = mode;
    this.userLat = null;
    this.userLon = null;
    this.locationLabel = '';
    this.addressInput = '';
    this.addressSuggestions = [];
    this.geocodeError = false;
  }

  toggleWilaya(w: string): void {
    const idx = this.selectedWilayas.indexOf(w);
    if (idx >= 0) this.selectedWilayas.splice(idx, 1);
    else this.selectedWilayas.push(w);
  }

  isWilayaSelected(w: string): boolean { return this.selectedWilayas.includes(w); }

  // ── Géolocalisation ────────────────────────────────────────

  async useMyLocation(): Promise<void> {
    this.locating = true;
    this.geocodeError = false;
    try {
      const pos = await this.geolocationService.getCurrentPosition();
      this.userLat = pos.latitude;
      this.userLon = pos.longitude;
      this.locationLabel = this.t.get('itinerary.my_location');
    } catch {
      this.geocodeError = true;
    } finally {
      this.locating = false;
    }
  }

  // ── Recherche d'adresse (Nominatim) ───────────────────────

  onAddressInput(): void {
    if (this.suggestTimer) clearTimeout(this.suggestTimer);
    this.userLat = null;
    this.userLon = null;
    this.locationLabel = '';
    if (this.addressInput.trim().length < 3) {
      this.addressSuggestions = [];
      this.showSuggestions = false;
      return;
    }
    this.suggestTimer = setTimeout(() => this.fetchSuggestions(), 400);
  }

  private async fetchSuggestions(): Promise<void> {
    this.geocoding = true;
    try {
      const q = encodeURIComponent(this.addressInput.trim());
      const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&countrycodes=dz`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
      const data: NominatimResult[] = await res.json();
      this.addressSuggestions = data;
      this.showSuggestions = data.length > 0;
    } catch {
      this.addressSuggestions = [];
    } finally {
      this.geocoding = false;
    }
  }

  selectSuggestion(s: NominatimResult): void {
    this.userLat = parseFloat(s.lat);
    this.userLon = parseFloat(s.lon);
    this.locationLabel = s.display_name;
    this.addressInput = s.display_name;
    this.showSuggestions = false;
    this.addressSuggestions = [];
  }

  hideSuggestions(): void {
    setTimeout(() => { this.showSuggestions = false; }, 200);
  }

  // ── Navigation wizard ────────────────────────────────────

  toggleInterest(id: string): void {
    const idx = this.selectedInterests.indexOf(id);
    if (idx >= 0) this.selectedInterests.splice(idx, 1);
    else this.selectedInterests.push(id);
  }

  isInterestSelected(id: string): boolean { return this.selectedInterests.includes(id); }

  canGoNext(): boolean {
    if (this.step === 1) {
      if (this.scopeMode === 'wilaya') return this.selectedWilayas.length > 0;
      return this.userLat !== null && this.userLon !== null;
    }
    if (this.step === 2) return this.days >= 1 && this.selectedInterests.length > 0;
    return true;
  }

  next(): void {
    if (!this.canGoNext()) return;
    if (this.step < 2) this.step++;
    else this.generate();
  }

  back(): void { if (this.step > 1) this.step--; }

  generate(): void {
    this.step = 3;
    this.loading = true;
    this.itinerary = null;
    this.error = '';
    this.addPlaceToDayIndex = null;

    let request: ItineraryRequest;
    if (this.scopeMode === 'radius') {
      request = {
        scope: 'radius',
        wilayas: [],
        latitude: this.userLat!,
        longitude: this.userLon!,
        radiusKm: this.radiusKm,
        locationLabel: this.locationLabel,
        days: this.days,
        interests: this.selectedInterests,
      };
    } else {
      request = {
        scope: 'wilaya',
        wilayas: [...this.selectedWilayas],
        days: this.days,
        interests: this.selectedInterests,
      };
    }

    this.itineraryService.generateItinerary(request).subscribe({
      next: (result) => {
        this.itinerary = result;
        this.loading = false;
        this.expandedDay = 0;
      },
      error: () => {
        this.loading = false;
        this.error = this.scopeMode === 'radius'
          ? this.t.get('itinerary.error_no_places_radius')
          : this.t.get('itinerary.error_no_places');
      },
    });
  }

  toggleDay(index: number): void {
    if (this.addPlaceToDayIndex === index) { this.closeAddPlace(); return; }
    this.expandedDay = this.expandedDay === index ? null : index;
    this.closeAddPlace();
  }

  reset(): void {
    this.step = 1;
    this.scopeMode = 'wilaya';
    this.selectedWilayas = [];
    this.userLat = null;
    this.userLon = null;
    this.locationLabel = '';
    this.addressInput = '';
    this.addressSuggestions = [];
    this.searchMode = 'geo';
    this.days = 1;
    this.selectedInterests = ['monuments', 'culture'];
    this.itinerary = null;
    this.error = '';
    this.addPlaceToDayIndex = null;
  }

  navigateToPlace(id: string | null | undefined, event: Event): void {
    event.stopPropagation();
    if (id) this.router.navigate(['/place', id]);
  }

  // ── Add / remove places ────────────────────────────────────

  openAddPlace(dayIndex: number, event: Event): void {
    event.stopPropagation();
    this.expandedDay = dayIndex;
    if (this.addPlaceToDayIndex === dayIndex) {
      this.closeAddPlace();
      return;
    }
    this.addPlaceToDayIndex = dayIndex;
    this.addPlaceQuery = '';
    this.refreshSearchResults();
  }

  closeAddPlace(): void {
    this.addPlaceToDayIndex = null;
    this.addPlaceQuery = '';
  }

  onAddPlaceSearch(): void { this.refreshSearchResults(); }

  private refreshSearchResults(): void {
    const q = this.addPlaceQuery.trim().toLowerCase();
    let pool = this.allPlaces;

    if (this.scopeMode === 'wilaya' && this.selectedWilayas.length > 0) {
      const inWilaya = pool.filter(p => this.selectedWilayas.includes(p.wilaya));
      if (inWilaya.length > 0) pool = inWilaya;
    } else if (this.scopeMode === 'radius' && this.userLat !== null && this.userLon !== null) {
      pool = pool.filter(p =>
        haversineKm(this.userLat!, this.userLon!, p.latitude, p.longitude) <= this.radiusKm
      );
    }

    if (q) {
      pool = pool.filter(p =>
        p.nameFr.toLowerCase().includes(q) ||
        p.wilaya.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    this.searchResults = [...pool]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 12);
  }

  async addPlaceToDay(place: Place, event: Event): Promise<void> {
    event.stopPropagation();
    if (!this.itinerary || this.addPlaceToDayIndex === null) return;
    const day = this.itinerary.days[this.addPlaceToDayIndex];
    const dayIndex = this.addPlaceToDayIndex;

    if (day.places.some(p => p.id === place.id)) {
      this.showToast(this.t.get('itinerary.place_already_added'), 'warning');
      return;
    }

    const sheet = await this.actionSheetCtrl.create({
      header: place.nameFr,
      subHeader: this.t.get('itinerary.choose_time'),
      cssClass: 'time-slot-sheet',
      buttons: [
        ...TIME_SLOTS.map(slot => ({
          text: this.t.get(slot.labelKey),
          handler: () => {
            this.confirmAddPlace(place, dayIndex, slot.id);
          },
        })),
        {
          text: this.t.get('itinerary.cancel'),
          role: 'cancel',
        },
      ],
    });

    await sheet.present();
  }

  private confirmAddPlace(place: Place, dayIndex: number, timeLabel: string): void {
    if (!this.itinerary) return;
    const day = this.itinerary.days[dayIndex];
    day.places.push({
      id: place.id,
      name: place.nameFr,
      category: place.category,
      time: timeLabel,
      duration: DURATION_BY_CATEGORY[place.category] ?? '2h',
      tips: '',
    });
    day.places.sort((a, b) =>
      (TIME_SLOT_ORDER[a.time] ?? 99) - (TIME_SLOT_ORDER[b.time] ?? 99)
    );
    this.closeAddPlace();
    this.showToast(this.t.get('itinerary.place_added'), 'success');
  }

  removePlaceFromDay(dayIndex: number, placeIndex: number, event: Event): void {
    event.stopPropagation();
    if (!this.itinerary) return;
    const day = this.itinerary.days[dayIndex];
    if (day.places.length <= 1) {
      this.showToast(this.t.get('itinerary.place_min_one'), 'warning');
      return;
    }
    day.places.splice(placeIndex, 1);
  }

  // ── Share ──────────────────────────────────────────────────

  async shareItinerary(): Promise<void> {
    if (!this.itinerary) return;

    let text = `${this.itinerary.title}\n${this.itinerary.summary}\n`;
    for (const day of this.itinerary.days) {
      text += `\n${day.title}\n`;
      for (const p of day.places) {
        text += `${this.getCategoryEmoji(p.category)} ${this.getItineraryPlaceName(p)} · ${this.getSlotLabel(p.time)} (${p.duration})\n`;
      }
    }
    text += `\nPartagé via GoDZ Algérie`;

    try {
      await Share.share({
        title: this.itinerary.title,
        text,
        dialogTitle: this.t.get('itinerary.share'),
      });
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        await this.showToast(this.t.get('itinerary.share_copied'), 'success');
      } catch {
        await this.showToast(this.t.get('itinerary.share_error'), 'danger');
      }
    }
  }

  // ── Helpers ────────────────────────────────────────────────

  getSlotLabel(slotId: string): string {
    return this.t.get('itinerary.ts_' + slotId);
  }

  getItineraryPlaceName(place: ItineraryPlace): string {
    if (place.id) {
      const full = this.allPlaces.find(p => p.id === place.id);
      if (full) return this.t.getPlaceName(full);
    }
    return place.name;
  }

  getCategoryEmoji(category: string): string {
    const map: Record<string, string> = {
      monuments: '🏛️', culture: '🎭', plages: '🏖️',
      montagnes: '⛰️', desert: '🏜️', restaurants: '🍽️',
      salons: '☕', artisanat: '🛍️',
    };
    return map[category] || '📍';
  }

  private async showToast(message: string, color: string): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2200, color, position: 'bottom' });
    await t.present();
  }
}
