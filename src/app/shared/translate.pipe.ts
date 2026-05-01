import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  pure: false,
  standalone: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private sub: Subscription;

  constructor(private t: TranslationService, private cdr: ChangeDetectorRef) {
    this.sub = t.currentLanguage$.subscribe(() => this.cdr.markForCheck());
  }

  transform(key: string): string {
    return this.t.get(key);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
