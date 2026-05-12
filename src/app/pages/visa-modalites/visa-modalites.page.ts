import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-visa-modalites',
  templateUrl: './visa-modalites.page.html',
  styleUrls: ['./visa-modalites.page.scss'],
  standalone: false
})
export class VisaModalitesPage {
  constructor(private router: Router, public t: TranslationService) {}
  goBack(): void { this.router.navigate(['/visa']); }
}
