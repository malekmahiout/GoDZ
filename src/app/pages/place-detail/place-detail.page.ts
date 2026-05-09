import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { PlacesService } from '../../services/places.service';
import { FavoritesService } from '../../services/favorites.service';
import { AudioGuideService } from '../../services/audio-guide.service';
import { ReviewsService } from '../../services/reviews.service';
import { TranslationService, AppLanguage } from '../../services/translation.service';
import { GroqTranslateService } from '../../services/groq-translate.service';
import { Place, Category } from '../../models/place.model';
import { Review } from '../../models/review.model';
import { PhotoService } from '../../services/photo.service';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
  standalone: false
})
export class PlaceDetailPage implements OnInit, OnDestroy {
  place: Place | undefined;
  displayImages: string[] = [];
  reviews: Review[] = [];
  isFavorite = false;
  isAudioPlaying = false;
  currentImageIndex = 0;
  descriptionLanguage: AppLanguage = 'fr';
  wikiDescriptions: Record<string, string> = {};
  descExpanded = false;

  // Traduction Groq
  translatedDescription = '';
  translatedReviewTexts: string[] = [];
  isTranslating = false;

  private langSub: Subscription | undefined;

  private categoryEmojis: Record<Category, string> = {
    monuments: '🏛️', culture: '🎭', plages: '🏖️',
    montagnes: '⛰️', desert: '🏜️', restaurants: '🍽️', salons: '☕', artisanat: '🛍️'
  };

  private categoryLabels: Record<Category, string> = {
    monuments: 'Monuments', culture: 'Culture & Loisirs',
    plages: 'Plages', montagnes: 'Montagnes', desert: 'Désert',
    restaurants: 'Restaurants', salons: 'Cafés', artisanat: 'Artisanat'
  };

  showCollectionSheet = false;
  collectionPickList: import('../../services/favorites.service').FavoriteCollection[] = [];
  selectedCollectionId = 'default';


  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private placesService: PlacesService,
    private favoritesService: FavoritesService,
    private audioGuideService: AudioGuideService,
    private reviewsService: ReviewsService,
    private toastCtrl: ToastController,
    public t: TranslationService,
    private photoService: PhotoService,
    private groqTranslate: GroqTranslateService,
  ) {}

  ngOnInit(): void {
    this.descriptionLanguage = this.t.getCurrentLanguage();

    this.langSub = this.t.currentLanguage$.subscribe(lang => {
      this.descriptionLanguage = lang;
      if (this.isAudioPlaying) {
        this.audioGuideService.stop();
        this.isAudioPlaying = false;
      }
      this.translateContent(lang);
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.placesService.getPlaceById(id).subscribe(place => {
        this.place = place;
        if (place) {
          this.displayImages = place.images.slice(0, 3);
          this.isFavorite = this.favoritesService.isFavorite(place.id);

          this.reviewsService.getReviewsByPlaceId(place.id).subscribe(r => {
            this.reviews = r;
            this.translatedReviewTexts = r.map(rev => rev.text);
            if (this.descriptionLanguage !== 'fr') {
              this.translateContent(this.descriptionLanguage);
            }
          });

          this.photoService.getPhotos(place, 3).subscribe(p => this.displayImages = p);

          this.photoService.getWikipediaExtractLang(place, 'fr').subscribe(text => {
            if (text && text.length > 80) {
              this.wikiDescriptions['fr'] = text;
              if (this.descriptionLanguage !== 'fr') this.translateContent(this.descriptionLanguage);
            }
          });
          this.photoService.getWikipediaExtractLang(place, 'en').subscribe(text => {
            if (text && text.length > 80) this.wikiDescriptions['en'] = text;
          });
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.audioGuideService.stop();
    this.langSub?.unsubscribe();
  }

  private translateContent(lang: AppLanguage): void {
    if (!this.place || lang === 'fr') {
      this.translatedDescription = '';
      this.translatedReviewTexts = this.reviews.map(r => r.text);
      return;
    }

    // Source: Wikipedia FR or base description
    const descSource = this.wikiDescriptions['fr'] || this.place.description;

    // For AR: use stored field as initial value, then refine with Groq
    if (lang === 'ar' && this.place.descriptionAr) {
      this.translatedDescription = this.place.descriptionAr;
    }
    // For EN: use wikipedia EN if available
    if (lang === 'en' && this.wikiDescriptions['en']) {
      this.translatedDescription = this.wikiDescriptions['en'];
    }

    if (!this.groqTranslate) return;

    const reviewTexts = this.reviews.map(r => r.text).filter(t => t?.trim());
    this.isTranslating = true;

    // Translate description
    this.groqTranslate.translateText(descSource, lang).subscribe({
      next: translated => {
        this.translatedDescription = translated;
        this.isTranslating = reviewTexts.length > 0;
      },
      error: () => { this.isTranslating = false; }
    });

    // Translate reviews in batch
    if (reviewTexts.length > 0) {
      this.groqTranslate.translateBatch(reviewTexts, lang).subscribe({
        next: translated => {
          this.translatedReviewTexts = translated;
          this.isTranslating = false;
        },
        error: () => {
          this.translatedReviewTexts = reviewTexts;
          this.isTranslating = false;
        }
      });
    }
  }

  getCurrentDescription(): string {
    if (!this.place) return '';
    if (this.descriptionLanguage === 'fr') return this.wikiDescriptions['fr'] || this.place.description;
    if (this.translatedDescription) return this.translatedDescription;
    // Fallback while loading
    if (this.descriptionLanguage === 'ar' && this.place.descriptionAr) return this.place.descriptionAr;
    if (this.descriptionLanguage === 'en') return this.wikiDescriptions['en'] || this.place.description;
    return this.wikiDescriptions['fr'] || this.place.description;
  }

  getReviewText(index: number): string {
    return this.translatedReviewTexts[index] ?? this.reviews[index]?.text ?? '';
  }

  getShortDescription(): string {
    const full = this.getCurrentDescription();
    if (this.descExpanded || full.length <= 280) return full;
    return full.slice(0, 280) + '…';
  }

  goBack(): void { this.navCtrl.back(); }

  async toggleFavorite(): Promise<void> {
    if (!this.place) return;

    if (this.isFavorite) {
      this.favoritesService.removeFavorite(this.place.id);
      this.isFavorite = false;
      this.showToast(this.t.get('detail.remove_favorite'), 'medium');
      return;
    }

    // Toujours ouvrir le bottom sheet pour choisir ou créer une liste
    const collections = this.favoritesService.getCollections();
    this.collectionPickList = collections;
    this.selectedCollectionId = collections[0]?.id ?? 'default';
    this.showCollectionSheet = true;
  }

  createCollectionFromSheet(): void {
    const name = prompt(this.t.get('favorites.collection_name'));
    if (!name?.trim()) return;
    const newCol = this.favoritesService.createCollection(name.trim());
    this.collectionPickList = this.favoritesService.getCollections();
    this.selectedCollectionId = newCol.id;
  }

  confirmAddToCollection(): void {
    if (!this.place) return;
    this.favoritesService.addFavorite(this.place.id, this.selectedCollectionId);
    this.isFavorite = true;
    this.showCollectionSheet = false;
    this.showToast(this.t.get('detail.add_favorite') + ' ❤️', 'success');
  }

  async toggleAudioGuide(): Promise<void> {
    if (!this.place) return;
    if (this.isAudioPlaying) {
      await this.audioGuideService.stop();
      this.isAudioPlaying = false;
    } else {
      const text = this.getCurrentDescription();
      this.isAudioPlaying = true;
      await this.audioGuideService.speak(text, this.descriptionLanguage);
      this.isAudioPlaying = false;
    }
  }

  getWikiUrl(): string {
    if (!this.place) return '';
    const lang = this.descriptionLanguage === 'ar' ? 'ar' : 'fr';
    const title = this.descriptionLanguage === 'en' ? this.place.nameEn : this.place.nameFr;
    return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
  }

  nextImage(): void {
    if (this.currentImageIndex < this.displayImages.length - 1) this.currentImageIndex++;
  }

  prevImage(): void {
    if (this.currentImageIndex > 0) this.currentImageIndex--;
  }

  setImage(i: number): void { this.currentImageIndex = i; }

  openGoogleMaps(): void {
    if (!this.place) return;
    const query = encodeURIComponent(`${this.place.nameFr}, ${this.place.wilaya}, Algérie`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  }

  openWikipedia(): void {
    window.open(this.getWikiUrl(), '_blank');
  }

  getCategoryEmoji(cat: Category): string { return this.categoryEmojis[cat] || '📍'; }
  getCategoryLabel(cat: Category): string { return this.t.get('cat.' + cat) || this.categoryLabels[cat] || cat; }

  getStars(r: number): number[] { return Array(Math.round(r)).fill(0); }
  getRatingStars(r: number): { full: number[]; empty: number[] } {
    return { full: Array(Math.round(r)).fill(0), empty: Array(5 - Math.round(r)).fill(0) };
  }

  private async showToast(message: string, color: string): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }
}
