import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlacePhotoDirective } from '../directives/place-photo.directive';
import { TranslatePipe } from './translate.pipe';

@NgModule({
  declarations: [PlacePhotoDirective, TranslatePipe],
  imports: [CommonModule],
  exports: [PlacePhotoDirective, TranslatePipe]
})
export class SharedModule {}
