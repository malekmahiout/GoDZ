import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { PlacesService } from '../../services/places.service';
import { TranslationService } from '../../services/translation.service';
import { Place, Category } from '../../models/place.model';

type SortOption = 'popularity' | 'rating' | 'name';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.page.html',
  styleUrls: ['./category-list.page.scss'],
  standalone: false
})
export class CategoryListPage implements OnInit {
  places: Place[] = [];
  sortedPlaces: Place[] = [];
  category: Category | null = null;
  isLoading = true;
  sortBy: SortOption = 'popularity';
  selectedWilaya: string | null = null;
  wilayas = ['Alger', 'Oran', 'Tizi Ouzou', 'Tlemcen', 'Béjaïa', 'Annaba'];

  private categoryEmojis: Record<Category, string> = {
    monuments: '🏛️',
    culture: '🎭',
    plages: '🏖️',
    montagnes: '⛰️',
    desert: '🏜️',
    restaurants: '🍽️',
    salons: '☕',
    artisanat: '🛍️'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController,
    private placesService: PlacesService,
    public t: TranslationService
  ) {}

  ngOnInit(): void {
    const cat = this.route.snapshot.paramMap.get('cat') as Category;
    if (cat) {
      this.category = cat;
      this.placesService.getPlacesByCategory(cat).subscribe(places => {
        this.places = places;
        this.applySort();
        this.isLoading = false;
      });
    }
  }

  setSortBy(sort: SortOption): void {
    this.sortBy = sort;
    this.applySort();
  }

  selectWilaya(w: string): void {
    this.selectedWilaya = this.selectedWilaya === w ? null : w;
    this.applySort();
  }

  applySort(): void {
    let arr = this.selectedWilaya
      ? this.places.filter(p => p.wilaya === this.selectedWilaya)
      : [...this.places];
    switch (this.sortBy) {
      case 'rating':
        arr.sort((a, b) => b.googleRating - a.googleRating);
        break;
      case 'name':
        arr.sort((a, b) => a.nameFr.localeCompare(b.nameFr));
        break;
      case 'popularity':
      default:
        arr.sort((a, b) => b.popularity - a.popularity);
        break;
    }
    this.sortedPlaces = arr;
  }

  goToDetail(place: Place): void {
    this.router.navigate(['/place', place.id]);
  }

  goBack(): void {
    this.navCtrl.back();
  }

  getCategoryTitle(): string {
    return this.category ? this.t.get('cat.' + this.category) : '';
  }

  getCategoryEmoji(): string {
    return this.category ? (this.categoryEmojis[this.category] || '📍') : '📍';
  }

  getStars(rating: number): number[] {
    return Array(Math.round(rating)).fill(0);
  }

  getEmptyStars(rating: number): number[] {
    return Array(5 - Math.round(rating)).fill(0);
  }
}
