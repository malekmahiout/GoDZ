import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PlacesService } from '../../services/places.service';
import { TranslationService, AppLanguage } from '../../services/translation.service';
import { GroqTranslateService } from '../../services/groq-translate.service';
import { Place, Category } from '../../models/place.model';

interface CategoryFilter {
  id: Category | 'all';
  emoji: string;
}

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: false
})
export class MapPage implements OnInit, OnDestroy {
  selectedWilaya: string | null = null;
  filteredPlaces: Place[] = [];
  allPlaces: Place[] = [];
  selectedCat: Category | 'all' = 'all';
  sortBy: 'rating' | 'popularity' | 'reviews' = 'rating';
  searchQuery = '';

  wilayas = ['Alger', 'Oran', 'Tizi Ouzou', 'Tlemcen', 'Béjaïa', 'Annaba'];

  categoryFilters: CategoryFilter[] = [
    { id: 'all',         emoji: '🌍' },
    { id: 'monuments',   emoji: '🏛️' },
    { id: 'culture',     emoji: '🎭' },
    { id: 'plages',      emoji: '🏖️' },
    { id: 'restaurants', emoji: '🍽️' },
    { id: 'salons',      emoji: '☕' },
    { id: 'artisanat',   emoji: '🛍️' }
  ];

  private langSub: Subscription | undefined;

  constructor(
    private placesService: PlacesService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private groqTranslate: GroqTranslateService,
    public t: TranslationService
  ) {}

  ngOnInit(): void {
    this.placesService.getPlaces().subscribe(places => {
      this.allPlaces = places;
      this.applyFilters();
      const lang = this.t.getCurrentLanguage();
      if (lang === 'es' || lang === 'de') {
        this.groqTranslate.translatePlaceNames(this.allPlaces, lang).subscribe(() => {
          this.cdr.detectChanges();
        });
      }
    });

    this.route.queryParamMap.subscribe(params => {
      const wilaya = params.get('wilaya');
      if (wilaya) {
        this.selectedWilaya = wilaya;
        this.applyFilters();
      }
    });

    this.langSub = this.t.currentLanguage$.subscribe(lang => {
      this.cdr.detectChanges();
      if ((lang === 'es' || lang === 'de') && this.allPlaces.length) {
        this.groqTranslate.translatePlaceNames(this.allPlaces, lang).subscribe(() => {
          this.cdr.detectChanges();
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  ionViewWillEnter(): void {
    const wilaya = this.route.snapshot.queryParamMap.get('wilaya');
    this.selectedWilaya = wilaya || this.selectedWilaya;
    this.applyFilters();
  }

  selectWilaya(name: string): void {
    this.selectedWilaya = this.selectedWilaya === name ? null : name;
    this.applyFilters();
  }

  onSearch(event: any): void {
    this.searchQuery = (event.target?.value || '').toLowerCase();
    this.applyFilters();
  }

  applyFilters(): void {
    let places = [...this.allPlaces];
    if (this.selectedWilaya) {
      places = places.filter(p => p.wilaya === this.selectedWilaya);
    }
    if (this.selectedCat !== 'all') {
      places = places.filter(p => p.category === this.selectedCat);
    }
    if (this.searchQuery) {
      places = places.filter(p =>
        p.nameFr.toLowerCase().includes(this.searchQuery) ||
        p.wilaya.toLowerCase().includes(this.searchQuery) ||
        p.description.toLowerCase().includes(this.searchQuery)
      );
    }
    this.filteredPlaces = this.sortPlaces(places);
  }

  sortPlaces(places: Place[]): Place[] {
    return [...places].sort((a, b) => {
      if (this.sortBy === 'rating')     return b.googleRating - a.googleRating;
      if (this.sortBy === 'popularity') return b.popularity - a.popularity;
      if (this.sortBy === 'reviews')    return b.googleReviewCount - a.googleReviewCount;
      return 0;
    });
  }

  setSortBy(by: 'rating' | 'popularity' | 'reviews'): void {
    this.sortBy = by;
    this.filteredPlaces = this.sortPlaces(this.filteredPlaces);
  }

  clearAll(): void {
    this.selectedWilaya = null;
    this.selectedCat = 'all';
    this.searchQuery = '';
    this.applyFilters();
  }

  goToPlace(id: string): void {
    this.router.navigate(['/place', id]);
  }

  openGoogleMaps(place: Place): void {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`,
      '_blank'
    );
  }

  getCatEmoji(cat: Category): string {
    const map: Record<Category, string> = {
      monuments:   '🏛️',
      culture:     '🎭',
      plages:      '🏖️',
      montagnes:   '⛰️',
      desert:      '🏜️',
      restaurants: '🍽️',
      salons:      '☕',
      artisanat:   '🛍️'
    };
    return map[cat] || '📍';
  }
}
