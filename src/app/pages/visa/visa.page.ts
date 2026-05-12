import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationService } from '../../services/translation.service';

interface VisaAction {
  id: 'download' | 'prefill' | 'modalites';
  labelKey: string;
  icon: string;
  type: 'primary' | 'secondary';
}

interface VisaDocument {
  step: number;
  titleKey: string;
  count?: string;
  descKey: string;
  catKey: string;
  categoryColor: string;
  categoryBg: string;
  icon: string;
  actions?: VisaAction[];
  highlightKey?: string;
  warningKey?: string;
}

@Component({
  selector: 'app-visa',
  templateUrl: './visa.page.html',
  styleUrls: ['./visa.page.scss'],
  standalone: false
})
export class VisaPage {

  documents: VisaDocument[] = [
    {
      step: 1,
      titleKey: 'visa.doc1_title',
      count: '×2',
      descKey: 'visa.doc1_desc',
      catKey: 'visa.doc1_cat',
      categoryColor: '#006233',
      categoryBg: 'rgba(0,98,51,0.10)',
      icon: '📋',
      actions: [
        { id: 'download',  labelKey: 'visa.doc1_action_download',  icon: '⬇️', type: 'secondary' },
        { id: 'prefill',   labelKey: 'visa.doc1_action_prefill',   icon: '✏️', type: 'primary'   },
        { id: 'modalites', labelKey: 'visa.doc1_action_modalites', icon: '📅', type: 'secondary' }
      ],
      highlightKey: 'visa.doc1_highlight'
    },
    {
      step: 2,
      titleKey: 'visa.doc2_title',
      descKey: 'visa.doc2_desc',
      catKey: 'visa.doc2_cat',
      categoryColor: '#2563EB',
      categoryBg: 'rgba(37,99,235,0.10)',
      icon: '🛂'
    },
    {
      step: 3,
      titleKey: 'visa.doc3_title',
      count: '×2',
      descKey: 'visa.doc3_desc',
      catKey: 'visa.doc2_cat',
      categoryColor: '#2563EB',
      categoryBg: 'rgba(37,99,235,0.10)',
      icon: '🪪'
    },
    {
      step: 4,
      titleKey: 'visa.doc4_title',
      descKey: 'visa.doc4_desc',
      catKey: 'visa.doc4_cat',
      categoryColor: '#D97706',
      categoryBg: 'rgba(217,119,6,0.10)',
      icon: '🏥'
    },
    {
      step: 5,
      titleKey: 'visa.doc5_title',
      descKey: 'visa.doc5_desc',
      catKey: 'visa.doc5_cat',
      categoryColor: '#7C3AED',
      categoryBg: 'rgba(124,58,237,0.10)',
      icon: '💶'
    },
    {
      step: 6,
      titleKey: 'visa.doc6_title',
      count: '< 3 mois',
      descKey: 'visa.doc6_desc',
      catKey: 'visa.doc6_cat',
      categoryColor: '#EA580C',
      categoryBg: 'rgba(234,88,12,0.10)',
      icon: '🏠',
      warningKey: 'visa.doc6_warning'
    },
    {
      step: 7,
      titleKey: 'visa.doc7_title',
      count: '< 3 mois',
      descKey: 'visa.doc7_desc',
      catKey: 'visa.doc7_cat',
      categoryColor: '#0891B2',
      categoryBg: 'rgba(8,145,178,0.10)',
      icon: '🏨',
      warningKey: 'visa.doc7_warning'
    }
  ];

  constructor(private router: Router, public t: TranslationService) {}

  goBack(): void {
    this.router.navigate(['/tabs/home']);
  }

  onAction(action: VisaAction): void {
    if (action.id === 'download') {
      const a = document.createElement('a');
      a.href = 'assets/formulaire_visa.pdf';
      a.download = 'formulaire_visa.pdf';
      a.click();
    } else if (action.id === 'prefill') {
      this.router.navigate(['/visa-form']);
    } else if (action.id === 'modalites') {
      this.router.navigate(['/visa-modalites']);
    }
  }
}
