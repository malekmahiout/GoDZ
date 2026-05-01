import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { FavoritesService, FavoriteCollection } from '../../services/favorites.service';
import { PlacesService } from '../../services/places.service';
import { TranslationService } from '../../services/translation.service';
import { Place } from '../../models/place.model';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
  standalone: false
})
export class FavoritesPage implements OnInit, OnDestroy {
  collections: FavoriteCollection[] = [];
  activeCollectionId = 'default';
  displayPlaces: Place[] = [];
  allPlaces: Place[] = [];

  // Bottom sheet déplacement
  showMoveSheet = false;
  movingPlace: Place | null = null;
  moveTargetId = '';
  moveTargetCollections: FavoriteCollection[] = [];

  private colSub: Subscription | undefined;

  constructor(
    private favoritesService: FavoritesService,
    private placesService: PlacesService,
    private router: Router,
    private alertCtrl: AlertController,
    public t: TranslationService
  ) {}

  ngOnInit(): void {
    this.placesService.getPlaces().subscribe(places => {
      this.allPlaces = places;
      this.refresh();
    });

    this.colSub = this.favoritesService.collections$.subscribe(() => this.refresh());
  }

  ngOnDestroy(): void {
    this.colSub?.unsubscribe();
  }

  ionViewWillEnter(): void {
    this.refresh();
  }

  private refresh(): void {
    this.collections = this.favoritesService.getCollections();
    if (!this.collections.find(c => c.id === this.activeCollectionId)) {
      this.activeCollectionId = this.collections[0]?.id ?? 'default';
    }
    this.updateDisplayPlaces();
  }

  selectCollection(id: string): void {
    this.activeCollectionId = id;
    this.updateDisplayPlaces();
  }

  get activeCollection(): FavoriteCollection | undefined {
    return this.collections.find(c => c.id === this.activeCollectionId);
  }

  private updateDisplayPlaces(): void {
    const col = this.activeCollection;
    if (!col) { this.displayPlaces = []; return; }
    this.displayPlaces = this.allPlaces.filter(p => col.placeIds.includes(p.id));
  }

  goToDetail(place: Place): void {
    this.router.navigate(['/place', place.id]);
  }

  removeFavorite(place: Place, event: Event): void {
    event.stopPropagation();
    this.favoritesService.removeFavorite(place.id, this.activeCollectionId);
    this.displayPlaces = this.displayPlaces.filter(p => p.id !== place.id);
  }

  openMoveSheet(place: Place, event: Event): void {
    event.stopPropagation();
    this.movingPlace = place;
    this.moveTargetCollections = this.collections.filter(c => c.id !== this.activeCollectionId);
    this.moveTargetId = this.moveTargetCollections[0]?.id ?? '';
    this.showMoveSheet = true;
  }

  confirmMove(): void {
    if (!this.movingPlace || !this.moveTargetId) return;
    this.favoritesService.removeFavorite(this.movingPlace.id, this.activeCollectionId);
    this.favoritesService.addFavorite(this.movingPlace.id, this.moveTargetId);
    this.displayPlaces = this.displayPlaces.filter(p => p.id !== this.movingPlace!.id);
    this.showMoveSheet = false;
    this.movingPlace = null;
  }

  async createCollection(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.t.get('favorites.new_collection'),
      inputs: [{ name: 'name', type: 'text', placeholder: this.t.get('favorites.collection_name') }],
      cssClass: 'dark-alert',
      buttons: [
        { text: this.t.get('common.back'), role: 'cancel' },
        {
          text: this.t.get('favorites.create_collection'),
          handler: (data) => {
            const name = data.name?.trim();
            if (name) {
              const col = this.favoritesService.createCollection(name);
              this.activeCollectionId = col.id;
              this.refresh();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteCollection(col: FavoriteCollection, event: Event): Promise<void> {
    event.stopPropagation();
    if (col.id === 'default') return;
    const alert = await this.alertCtrl.create({
      header: this.t.get('favorites.delete_collection'),
      message: `"${col.name}"`,
      cssClass: 'dark-alert',
      buttons: [
        { text: this.t.get('common.back'), role: 'cancel' },
        {
          text: 'OK',
          role: 'destructive',
          handler: () => {
            this.favoritesService.deleteCollection(col.id);
            this.activeCollectionId = 'default';
            this.refresh();
          }
        }
      ]
    });
    await alert.present();
  }

  async clearCollection(): Promise<void> {
    const col = this.activeCollection;
    if (!col) return;
    const alert = await this.alertCtrl.create({
      header: this.t.get('favorites.empty'),
      message: `"${col.name}"`,
      cssClass: 'dark-alert',
      buttons: [
        { text: this.t.get('common.back'), role: 'cancel' },
        {
          text: 'OK',
          role: 'destructive',
          handler: () => {
            this.favoritesService.clearCollection(col.id);
            this.displayPlaces = [];
          }
        }
      ]
    });
    await alert.present();
  }
}
