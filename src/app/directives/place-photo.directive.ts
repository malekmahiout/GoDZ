import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';
import { Place } from '../models/place.model';
import { PhotoService } from '../services/photo.service';

@Directive({ selector: 'img[placePhoto]', standalone: false })
export class PlacePhotoDirective implements OnInit {
  @Input('placePhoto') place!: Place;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2,
    private photoService: PhotoService
  ) {}

  ngOnInit() {
    if (!this.place) return;
    const img = this.el.nativeElement;
    this.renderer.setStyle(img, 'opacity', '0');
    this.renderer.setStyle(img, 'transition', 'opacity 0.3s ease');
    this.renderer.setStyle(img, 'background-color', '#F3F4F6');

    this.photoService.getPhoto(this.place).subscribe({
      next: url => {
        // Handlers avant src — évite de manquer les images déjà en cache
        img.onload = () => this.renderer.setStyle(img, 'opacity', '1');
        img.onerror = () => {
          const fb = this.place.images?.[0];
          if (fb && fb !== url) {
            this.renderer.setAttribute(img, 'src', fb);
          } else {
            this.renderer.setStyle(img, 'opacity', '1');
          }
        };
        this.renderer.setAttribute(img, 'src', url);
        if (img.complete && img.naturalWidth > 0) {
          this.renderer.setStyle(img, 'opacity', '1');
        }
      },
      error: () => {
        const fb = this.place.images?.[0];
        if (fb) this.renderer.setAttribute(img, 'src', fb);
        this.renderer.setStyle(img, 'opacity', '1');
      }
    });
  }
}
