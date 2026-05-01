import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationService } from '../../services/translation.service';
import { PlacesService } from '../../services/places.service';
import { Category } from '../../models/place.model';

interface CategoryCard {
  key: Category;
  emoji: string;
  gradient: string;
  count: number;
}

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  standalone: false
})
export class CategoriesPage implements OnInit {

  categories: CategoryCard[] = [
    {
      key: 'monuments', emoji: '🏛️',
      gradient: 'linear-gradient(135deg, #FFF8E1, #FFE082)',
      count: 0
    },
    {
      key: 'culture', emoji: '🎭',
      gradient: 'linear-gradient(135deg, #F3E5F5, #CE93D8)',
      count: 0
    },
    {
      key: 'plages', emoji: '🏖️',
      gradient: 'linear-gradient(135deg, #E3F2FD, #90CAF9)',
      count: 0
    },
    {
      key: 'restaurants', emoji: '🍽️',
      gradient: 'linear-gradient(135deg, #FCE4EC, #F48FB1)',
      count: 0
    },
    {
      key: 'salons', emoji: '☕',
      gradient: 'linear-gradient(135deg, #EFEBE9, #BCAAA4)',
      count: 0
    },
    {
      key: 'artisanat', emoji: '🛍️',
      gradient: 'linear-gradient(135deg, #FFF3E0, #FFCC80)',
      count: 0
    }
  ];

  constructor(
    private router: Router,
    private placesService: PlacesService,
    public t: TranslationService
  ) {}

  ngOnInit(): void {
    this.placesService.getPlaces().subscribe(places => {
      this.categories.forEach(cat => {
        cat.count = places.filter(p => p.category === cat.key).length;
      });
    });
  }

  goToCategory(cat: Category): void {
    this.router.navigate(['/category', cat]);
  }

  getCategoryLabel(key: Category): string {
    const labels: Record<Category, string> = {
      monuments: 'Monuments',
      culture: 'Culture & Loisirs',
      plages: 'Plages',
      montagnes: 'Montagnes',
      desert: 'Désert',
      restaurants: 'Restaurants',
      salons: 'Cafés',
      artisanat: 'Artisanat & Boutiques'
    };
    return labels[key] || key;
  }
}
