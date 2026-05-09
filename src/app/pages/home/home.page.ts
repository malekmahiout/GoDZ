import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PlacesService } from '../../services/places.service';
import { TranslationService, AppLanguage } from '../../services/translation.service';
import { GroqTranslateService } from '../../services/groq-translate.service';
import { Place } from '../../models/place.model';

interface WilayaItem {
  name: string;
  image: string;
  count: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit, OnDestroy {
  featuredPlaces: Place[] = [];

  private readonly heroByLanguage: Record<AppLanguage, string> = {
    fr: 'assets/photos/decouvrez_algerie.jpg',
    en: 'assets/photos/decouvrez_algerie_en.png',
    de: 'assets/photos/decouvrez_algerie_al.png',
    es: 'assets/photos/decouvrez_algerie_es.png',
    ar: 'assets/photos/decouvrez_algerie_ar.png',
  };

  heroImage = this.heroByLanguage['fr'];
  heroFallback = 'assets/photos/decouvrez_algerie.jpg';
  private langSub: Subscription | undefined;

  popularWilayas: WilayaItem[] = [
    { name: 'Alger',      image: 'assets/photos/Alger.jpg',    count: 169 },
    { name: 'Oran',       image: 'assets/photos/Oran.jpg',     count: 140 },
    { name: 'Tizi Ouzou', image: 'assets/photos/tizi.jpg',     count: 135 },
    { name: 'Tlemcen',    image: 'assets/photos/Tlemcen.jpg',  count: 135 },
    { name: 'Béjaïa',     image: 'assets/photos/bejaia.jpg',   count: 134 },
    { name: 'Annaba',     image: 'assets/photos/annaba.jpg',   count: 122 },
  ];

  constructor(
    private placesService: PlacesService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private groqTranslate: GroqTranslateService,
    public t: TranslationService
  ) {}

  ngOnInit(): void {
    this.heroImage = this.heroByLanguage[this.t.getCurrentLanguage()];

    this.langSub = this.t.currentLanguage$.subscribe(lang => {
      this.heroImage = this.heroByLanguage[lang];
      this.cdr.detectChanges();

      if ((lang === 'es' || lang === 'de') && this.featuredPlaces.length) {
        this.groqTranslate.translatePlaceNames(this.featuredPlaces, lang).subscribe(() => {
          this.cdr.detectChanges();
        });
      }
    });

    this.placesService.getFeaturedPlaces().subscribe(places => {
      this.featuredPlaces = places.slice(0, 12);
      const lang = this.t.getCurrentLanguage();
      if (lang === 'es' || lang === 'de') {
        this.groqTranslate.translatePlaceNames(this.featuredPlaces, lang).subscribe(() => {
          this.cdr.detectChanges();
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  ionViewWillEnter(): void {
    this.heroImage = this.heroByLanguage[this.t.getCurrentLanguage()];
    this.cdr.detectChanges();
  }

  onHeroError(evt: Event): void {
    (evt.target as HTMLImageElement).src = this.heroFallback;
  }

  navigateToPlace(id: string): void {
    this.router.navigate(['/place', id]);
  }

  navigateToMap(): void {
    this.router.navigate(['/tabs/map']);
  }

  navigateToWilaya(wilaya: string): void {
    this.router.navigate(['/tabs/map'], { queryParams: { wilaya } });
  }

  navigateToVisa(): void {
    this.router.navigate(['/visa']);
  }

  getAvailableLanguages() { return this.t.getAvailableLanguages(); }
  getCurrentLanguage(): AppLanguage { return this.t.getCurrentLanguage(); }
  setLanguage(lang: AppLanguage): void { this.t.setLanguage(lang); }
}
