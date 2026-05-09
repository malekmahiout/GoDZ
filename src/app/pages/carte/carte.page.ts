import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { PlacesService } from '../../services/places.service';
import { GeolocationService, UserPosition } from '../../services/geolocation.service';
import { Place, Category } from '../../models/place.model';
import { TranslationService } from '../../services/translation.service';

const RADIUS_PRESETS = [5, 10, 20, 50];

const CAT_COLORS: Record<Category, string> = {
  monuments:   '#D4A017',
  culture:     '#9C27B0',
  plages:      '#2196F3',
  montagnes:   '#607D8B',
  desert:      '#FF9800',
  restaurants: '#E91E63',
  salons:      '#795548',
  artisanat:   '#F57C00',
};

const CAT_EMOJIS: Record<Category, string> = {
  monuments: '🏛️', culture: '🎭', plages: '🏖️',
  montagnes: '⛰️', desert: '🏜️', restaurants: '🍽️',
  salons: '☕', artisanat: '🛍️',
};

function markerIcon(cat: Category): L.DivIcon {
  const color = CAT_COLORS[cat] || '#006233';
  return L.divIcon({
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2.5px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.45)"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

function userLocationIcon(): L.DivIcon {
  return L.divIcon({
    html: `<div style="position:relative;width:24px;height:24px">
      <div style="position:absolute;inset:0;background:#006233;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,98,51,0.55)"></div>
      <div style="position:absolute;inset:4px;background:rgba(0,98,51,0.25);border-radius:50%;animation:pulse 1.5s infinite"></div>
    </div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Component({
  selector: 'app-carte',
  templateUrl: './carte.page.html',
  styleUrls: ['./carte.page.scss'],
  standalone: false
})
export class CartePage implements OnDestroy {
  private map: L.Map | null = null;
  private userMarker: L.Marker | null = null;
  private radiusCircle: L.Circle | null = null;
  private allPlaces: Place[] = [];

  readonly radiusPresets = RADIUS_PRESETS;
  radiusKm = 10;

  geoMode = false;
  locating = false;
  geocoding = false;
  geocodeError = false;
  nearbyPlaces: Place[] = [];
  filteredNearbyPlaces: Place[] = [];
  selectedNearbyCategory: Category | 'all' = 'all';
  userPosition: UserPosition | null = null;

  // Mode recherche : 'geo' | 'address'
  searchMode: 'geo' | 'address' = 'geo';
  addressInput = '';
  suggestions: { display_name: string; lat: string; lon: string }[] = [];
  showSuggestions = false;
  private suggestTimer: any;

  // Cache coordonnées de la dernière suggestion choisie
  private cachedInput = '';
  private cachedLat = 0;
  private cachedLon = 0;

  nearbyFilters: { id: Category; emoji: string }[] = [
    { id: 'monuments',   emoji: '🏛️' },
    { id: 'culture',     emoji: '🎭' },
    { id: 'plages',      emoji: '🏖️' },
    { id: 'restaurants', emoji: '🍽️' },
    { id: 'salons',      emoji: '☕' },
    { id: 'artisanat',   emoji: '🛍️' },
  ];

  constructor(
    private placesService: PlacesService,
    private geolocationService: GeolocationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public t: TranslationService
  ) {}

  ionViewDidEnter(): void {
    if (!this.map) {
      this.initMap();
    } else {
      setTimeout(() => this.map?.invalidateSize(), 100);
    }
  }

  private initMap(): void {
    this.map = L.map('leaflet-map', {
      center: [36.5, 2.8],
      zoom: 7,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(this.map);

    this.placesService.getPlaces().subscribe(places => {
      this.allPlaces = places;
      places.forEach(place => this.addMarker(place));
    });
  }

  async locate(): Promise<void> {
    if (this.searchMode === 'address') {
      await this.searchByAddress();
    } else {
      await this.locateByGPS();
    }
  }

  async locateByGPS(): Promise<void> {
    if (this.locating) return;
    this.locating = true;
    this.geocodeError = false;

    try {
      const pos = await this.geolocationService.getCurrentPosition();
      this.applyPosition(pos.latitude, pos.longitude);
    } catch {
      this.geocodeError = true;
    } finally {
      this.locating = false;
    }
  }

  onAddressInput(value: string): void {
    this.addressInput = value;
    // Invalide le cache si l'utilisateur modifie l'adresse
    if (value !== this.cachedInput) {
      this.cachedInput = '';
      this.cachedLat = 0;
      this.cachedLon = 0;
    }
    clearTimeout(this.suggestTimer);
    if (value.trim().length < 3) {
      this.suggestions = [];
      this.showSuggestions = false;
      return;
    }
    this.suggestTimer = setTimeout(async () => {
      try {
        const encoded = encodeURIComponent(value.trim() + ', Algérie');
        const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=5&addressdetails=0`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
        const data = await res.json();
        this.suggestions = data || [];
        this.showSuggestions = this.suggestions.length > 0;
        this.cdr.detectChanges();
      } catch {
        this.suggestions = [];
        this.showSuggestions = false;
      }
    }, 400);
  }

  selectSuggestion(s: { display_name: string; lat: string; lon: string }): void {
    this.addressInput = s.display_name;
    this.showSuggestions = false;
    this.suggestions = [];
    this.cachedInput = s.display_name;
    this.cachedLat = parseFloat(s.lat);
    this.cachedLon = parseFloat(s.lon);
    this.applyPosition(this.cachedLat, this.cachedLon);
  }

  closeSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  async searchByAddress(): Promise<void> {
    const query = this.addressInput.trim();
    if (!query) return;

    // Réutilise les coordonnées en cache si l'adresse n'a pas changé
    if (query === this.cachedInput && this.cachedLat !== 0) {
      this.applyPosition(this.cachedLat, this.cachedLon);
      return;
    }

    this.geocoding = true;
    this.geocodeError = false;

    try {
      // N'ajoute pas ", Algérie" si déjà présent dans la chaîne
      const suffix = /alg[eé]rie|algeria/i.test(query) ? '' : ', Algérie';
      const encoded = encodeURIComponent(query + suffix);
      const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;
      const resp = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
      const data = await resp.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        this.cachedInput = query;
        this.cachedLat = lat;
        this.cachedLon = lon;
        this.applyPosition(lat, lon);
      } else {
        this.geocodeError = true;
      }
    } catch {
      this.geocodeError = true;
    } finally {
      this.geocoding = false;
    }
  }

  private applyPosition(lat: number, lon: number): void {
    this.userPosition = { latitude: lat, longitude: lon };

    this.userMarker?.remove();
    this.radiusCircle?.remove();

    if (this.map) {
      this.userMarker = L.marker([lat, lon], {
        icon: userLocationIcon(),
        zIndexOffset: 1000,
      })
        .bindPopup(`<strong>${this.t.get('carte.you_are_here')}</strong>`)
        .addTo(this.map);

      this.radiusCircle = L.circle([lat, lon], {
        radius: this.radiusKm * 1000,
        color: '#006233',
        fillColor: '#006233',
        fillOpacity: 0.07,
        weight: 1.5,
        dashArray: '6 4',
      }).addTo(this.map);

      this.map.flyTo([lat, lon], 10, { duration: 1.2 });
    }

    this.nearbyPlaces = this.allPlaces
      .map(p => ({ place: p, dist: haversineKm(lat, lon, p.latitude, p.longitude) }))
      .filter(({ dist }) => dist <= this.radiusKm)
      .sort((a, b) => a.dist - b.dist)
      .map(({ place }) => place);

    this.selectedNearbyCategory = 'all';
    this.filteredNearbyPlaces = [...this.nearbyPlaces];
    this.geoMode = true;
    this.cdr.detectChanges();

    setTimeout(() => this.map?.invalidateSize(), 350);
  }

  setNearbyCategory(cat: Category | 'all'): void {
    this.selectedNearbyCategory = cat;
    if (cat === 'all') {
      this.filteredNearbyPlaces = [...this.nearbyPlaces];
    } else {
      this.filteredNearbyPlaces = this.nearbyPlaces.filter(p => p.category === cat);
    }
  }

  closeSplit(): void {
    this.geoMode = false;
    this.userMarker?.remove();
    this.userMarker = null;
    this.radiusCircle?.remove();
    this.radiusCircle = null;
    this.userPosition = null;
    this.nearbyPlaces = [];
    this.filteredNearbyPlaces = [];
    this.selectedNearbyCategory = 'all';
    this.geocodeError = false;
    setTimeout(() => {
      this.map?.invalidateSize();
      this.map?.setView([36.5, 2.8], 7);
    }, 350);
  }

  getDistance(place: Place): number {
    if (!this.userPosition) return 0;
    return haversineKm(
      this.userPosition.latitude, this.userPosition.longitude,
      place.latitude, place.longitude
    );
  }

  getCategoryEmoji(cat: Category): string {
    return CAT_EMOJIS[cat] || '📍';
  }

  goToPlace(id: string): void {
    this.router.navigate(['/place', id]);
  }

  private mapsUrl(place: Place): string {
    const query = encodeURIComponent(`${place.nameFr}, ${place.wilaya}, Algérie`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  private addMarker(place: Place): void {
    if (!this.map) return;
    const marker = L.marker([place.latitude, place.longitude], {
      icon: markerIcon(place.category),
    });
    marker.bindPopup(this.buildPopup(place), { maxWidth: 240 });
    marker.addTo(this.map);
    marker.on('popupopen', () => {
      const btn = document.getElementById(`goto-${place.id}`);
      if (btn) {
        btn.onclick = () => this.router.navigate(['/place', place.id]);
      }
    });
  }

  private buildPopup(place: Place): string {
    const mapsUrl = this.mapsUrl(place);
    return `
      <div style="font-family:sans-serif;min-width:170px">
        <p style="font-weight:700;font-size:14px;margin:0 0 4px">${place.nameFr}</p>
        <p style="font-size:12px;color:#555;margin:0 0 8px">📍 ${place.wilaya} · ⭐ ${place.googleRating}</p>
        <div style="display:flex;gap:6px">
          <button id="goto-${place.id}"
            style="background:#4B5563;color:white;border:none;padding:6px 10px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;flex:1">
            Détails
          </button>
          <a href="${mapsUrl}" target="_blank"
            style="background:#006233;color:white;padding:6px 10px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;flex:1;text-align:center;display:inline-block">
            📍 Maps
          </a>
        </div>
      </div>`;
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
