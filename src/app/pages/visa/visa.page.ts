import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface VisaDocument {
  step: number;
  title: string;
  count?: string;
  description: string;
  category: string;
  categoryColor: string;
  categoryBg: string;
  icon: string;
  actions?: { label: string; icon: string; type: 'primary' | 'secondary'; url?: string }[];
  highlight?: string;
  warning?: string;
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
      title: 'Formulaire de demande de visa',
      count: '×2',
      description: 'Dûment rempli, daté et signé en double exemplaire',
      category: 'Administratif',
      categoryColor: '#006233',
      categoryBg: 'rgba(0,98,51,0.10)',
      icon: '📋',
      actions: [
        { label: 'Télécharger le PDF vierge', icon: '⬇️', type: 'secondary' },
        { label: 'Préremplir en ligne', icon: '✏️', type: 'primary' },
        { label: 'Modalités de dépôt', icon: '📅', type: 'secondary' }
      ],
      highlight: 'Préremplissez le formulaire en ligne — Gagnez du temps en saisissant vos informations directement dans l\'application.'
    },
    {
      step: 2,
      title: 'Passeport valide',
      description: 'Validité min. 6 mois + photocopie des 2 premiers feuillets + page du dernier visa Algérie',
      category: 'Identité',
      categoryColor: '#2563EB',
      categoryBg: 'rgba(37,99,235,0.10)',
      icon: '🛂'
    },
    {
      step: 3,
      title: '2 photos d\'identité récentes',
      count: '×2',
      description: 'Collées sur chacun des deux formulaires',
      category: 'Identité',
      categoryColor: '#2563EB',
      categoryBg: 'rgba(37,99,235,0.10)',
      icon: '🪪'
    },
    {
      step: 4,
      title: 'Attestation d\'assurance voyage',
      description: 'Rapatriement, hospitalisation et frais médicaux — couvrant toute la durée du voyage',
      category: 'Assurance',
      categoryColor: '#D97706',
      categoryBg: 'rgba(217,119,6,0.10)',
      icon: '🏥'
    },
    {
      step: 5,
      title: 'Justificatif de ressources',
      description: 'Salarié : fiche de paie ou attestation de travail. Non salarié : ASSEDIC, retraite, K-bis commerçant ou certificat de scolarité',
      category: 'Financier',
      categoryColor: '#7C3AED',
      categoryBg: 'rgba(124,58,237,0.10)',
      icon: '💶'
    },
    {
      step: 6,
      title: 'Justificatif de domicile',
      count: '< 3 mois',
      description: 'Au nom du demandeur — facture EDF, téléphone fixe ou impôts',
      category: 'Domicile',
      categoryColor: '#EA580C',
      categoryBg: 'rgba(234,88,12,0.10)',
      icon: '🏠',
      warning: 'QR code obligatoire sur le document'
    },
    {
      step: 7,
      title: 'Certificat d\'hébergement',
      count: '< 3 mois',
      description: 'Légalisé en mairie + copie pièce d\'identité de l\'hébergeant, ou réservation hôtel',
      category: 'Hébergement',
      categoryColor: '#0891B2',
      categoryBg: 'rgba(8,145,178,0.10)',
      icon: '🏨',
      warning: 'Si enfants mineurs : leurs noms doivent figurer sur le justificatif'
    }
  ];

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/tabs/home']);
  }

  onAction(action: { label: string; icon: string; type: string; url?: string }): void {
    if (action.label.includes('Télécharger')) {
      const a = document.createElement('a');
      a.href = 'assets/formulaire_visa.pdf';
      a.download = 'formulaire_visa.pdf';
      a.click();
    } else if (action.label.includes('Préremplir')) {
      this.router.navigate(['/visa-form']);
    } else if (action.label.includes('Modalités')) {
      this.router.navigate(['/visa-modalites']);
    }
  }
}
