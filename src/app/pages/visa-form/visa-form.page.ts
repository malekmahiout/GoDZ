import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { PDFDocument } from 'pdf-lib';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface PhotonFeature {
  type: string;
  geometry: { type: string; coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    postcode?: string;
    country?: string;
    state?: string;
    county?: string;
    type?: string;
    osm_key?: string;
    osm_value?: string;
    countrycode?: string;
  };
}

@Component({
  selector: 'app-visa-form',
  templateUrl: './visa-form.page.html',
  styleUrls: ['./visa-form.page.scss'],
  standalone: false
})
export class VisaFormPage implements OnInit {

  currentStep = 0;
  isGenerating = false;
  successMessage = '';
  errors: { [key: string]: string } = {};
  stepAttempted = false;
  generatedPdfBytes: Uint8Array<ArrayBuffer> | null = null;
  generatedPdfFilename = '';

  // Autocomplétion adresses
  suggestions: { [key: string]: PhotonFeature[] } = {};
  showSuggestions: { [key: string]: boolean } = {};
  private debounceTimers: { [key: string]: ReturnType<typeof setTimeout> } = {};

  // Pays disponibles avec code ISO
  readonly commonCountries: { label: string; code: string }[] = [
    { label: 'France', code: 'fr' },
    { label: 'Algérie', code: 'dz' },
    { label: 'Maroc', code: 'ma' },
    { label: 'Tunisie', code: 'tn' },
    { label: 'Belgique', code: 'be' },
    { label: 'Suisse', code: 'ch' },
    { label: 'Canada', code: 'ca' },
    { label: 'Espagne', code: 'es' },
    { label: 'Italie', code: 'it' },
    { label: 'Allemagne', code: 'de' },
    { label: 'Pays-Bas', code: 'nl' },
    { label: 'Royaume-Uni', code: 'gb' },
    { label: 'États-Unis', code: 'us' },
    { label: 'Portugal', code: 'pt' },
    { label: 'Suède', code: 'se' },
    { label: 'Autriche', code: 'at' },
    { label: 'Turquie', code: 'tr' },
    { label: 'Libye', code: 'ly' },
    { label: 'Mauritanie', code: 'mr' },
  ];

  steps = [
    { label: 'Identité', icon: '👤' },
    { label: 'Famille', icon: '👨‍👩‍👧' },
    { label: 'Passeport', icon: '🛂' },
    { label: 'Profession', icon: '💼' },
    { label: 'Voyage', icon: '✈️' }
  ];

  form = {
    // Identité
    nom: '', prenom: '', nom_jfille: '', pseudo: '',
    sexe: 'M',
    jour_nais: '', mois_nais: '', annee_nais: '',
    lieu_nais: '', pays_nais: '',
    nom_pere: '', nom_mere: '',
    nationalite_origin: '', nationalite_actu: '',
    pays_residence: 'fr',
    adress_perso: '', tel_perso: '',
    etat_civil: 'celibataire',

    // Conjoint
    prenom_conj: '', nom_conj: '',
    jour_nais_conj: '', mois_nais_conj: '', annee_nais_conj: '',
    pays_nais_conj: '', nationalite_conj: '',

    // Enfants
    fils_nom1: '', fils_dat_nais1: '', fils_lieu_nais1: '', fils_nat_nais1: '',
    fils_nom2: '', fils_dat_nais2: '', fils_lieu_nais2: '', fils_nat_nais2: '',
    fils_nom3: '', fils_dat_nais3: '', fils_lieu_nais3: '', fils_nat_nais3: '',

    // Document de voyage
    type_doc: 'ordinaire',
    num_pass: '',
    jour_deliv: '', mois_deliv: '', annee_deliv: '',
    jour_exp: '', mois_exp: '', annee_exp: '',
    deliv_par: '',

    // Profession
    prof: '', employeur: '', adress_prof: '', tel_prof: '',

    // Voyage
    destin_final: '', type_visa: 'court',
    transit_visa_dest: '',
    visa_sollicite: '',
    adress_sejour: '', motif_sejour: 'tourisme', autre_motif: '',
    jour_entree: '', mois_entree: '', annee_entree: '',
    duree_sejour: '', nbre_entrees: 'une', adres_sej2: '',

    // Précédents séjours
    precedent_sejour: 'non',
    adresse_prec_sejour: '',
    date_dernier_sejour: '',
    nbre_sejours_prec: ''
  };

  constructor(private router: Router, private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  // ─── Helpers date ─────────────────────────────────────────────

  private parseDate(j: string, m: string, a: string): Date | null {
    const day = parseInt(j, 10), month = parseInt(m, 10), year = parseInt(a, 10);
    if (!day || !month || !year) return null;
    if (year < 1900 || year > 2100) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    const d = new Date(year, month - 1, day);
    if (d.getMonth() !== month - 1) return null;
    return d;
  }

  private parseDateStr(s: string): Date | null {
    const parts = s.split('/');
    if (parts.length === 3) return this.parseDate(parts[0], parts[1], parts[2]);
    return null;
  }

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  private today(): Date {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }

  private formatDate(d: Date): string {
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  // ─── Computed alerts (temps réel) ────────────────────────────

  get passportDelivDate(): Date | null {
    return this.parseDate(this.form.jour_deliv, this.form.mois_deliv, this.form.annee_deliv);
  }

  get passportExpDate(): Date | null {
    return this.parseDate(this.form.jour_exp, this.form.mois_exp, this.form.annee_exp);
  }

  get entreeDate(): Date | null {
    return this.parseDate(this.form.jour_entree, this.form.mois_entree, this.form.annee_entree);
  }

  get passportAlertsStep2(): string[] {
    const alerts: string[] = [];
    const deliv = this.passportDelivDate;
    const exp = this.passportExpDate;

    if (deliv) {
      if (deliv > this.today()) alerts.push('La date de délivrance ne peut pas être dans le futur.');
      const maxAge = new Date(this.today()); maxAge.setFullYear(maxAge.getFullYear() - 10);
      if (deliv < maxAge) alerts.push('Date de délivrance trop ancienne : un passeport ne peut excéder 10 ans de validité.');
    }
    if (exp) {
      if (exp <= this.today()) alerts.push('Votre passeport est expiré — il doit être en cours de validité.');
      else {
        const minFromToday = this.addMonths(this.today(), 6);
        if (exp < minFromToday) alerts.push(`Passeport insuffisant : il doit être valide au moins 6 mois à partir d'aujourd'hui (jusqu'au ${this.formatDate(minFromToday)}).`);
      }
      if (deliv && exp <= deliv) alerts.push('La date d\'expiration doit être postérieure à la date de délivrance.');
    }
    return alerts;
  }

  get travelAlertsStep4(): string[] {
    const alerts: string[] = [];
    const entree = this.entreeDate;
    const exp = this.passportExpDate;

    if (entree) {
      if (entree <= this.today()) {
        alerts.push('La date d\'entrée en Algérie doit être une date future.');
      } else if (exp) {
        if (entree >= exp) {
          alerts.push('Votre passeport expire avant votre date d\'entrée prévue.');
        } else {
          const minValid = this.addMonths(entree, 6);
          if (exp < minValid) {
            alerts.push(`Passeport insuffisant : il doit être valide jusqu'au ${this.formatDate(minValid)} (6 mois après votre entrée). Date d'expiration actuelle : ${this.formatDate(exp)}.`);
          }
        }
      }
    }
    return alerts;
  }

  // ─── Validation par étape ─────────────────────────────────────

  validateStep(step: number): boolean {
    this.errors = {};

    if (step === 0) {
      if (!this.form.nom.trim()) this.errors['nom'] = 'Champ obligatoire.';
      if (!this.form.prenom.trim()) this.errors['prenom'] = 'Champ obligatoire.';
      if (!this.form.nationalite_actu.trim()) this.errors['nationalite_actu'] = 'Champ obligatoire.';
      if (!this.form.nationalite_origin.trim()) this.errors['nationalite_origin'] = 'Champ obligatoire.';
      if (!this.form.lieu_nais.trim()) this.errors['lieu_nais'] = 'Champ obligatoire.';
      if (!this.form.pays_nais.trim()) this.errors['pays_nais'] = 'Champ obligatoire.';
      if (!this.form.adress_perso.trim()) this.errors['adress_perso'] = 'Champ obligatoire.';
      if (!this.form.tel_perso.trim()) this.errors['tel_perso'] = 'Champ obligatoire.';

      const nais = this.parseDate(this.form.jour_nais, this.form.mois_nais, this.form.annee_nais);
      if (!nais) {
        this.errors['date_nais'] = 'Date invalide — format attendu : JJ MM AAAA.';
      } else if (nais >= this.today()) {
        this.errors['date_nais'] = 'La date de naissance doit être dans le passé.';
      } else {
        const age = (this.today().getTime() - nais.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (age > 120) this.errors['date_nais'] = 'Date improbable (âge supérieur à 120 ans).';
        if (age < 1) this.errors['date_nais'] = 'Âge inférieur à 1 an — utilisez la section enfants mineurs.';
      }
    }

    if (step === 1) {
      // Conjoint : si un champ est rempli, valider la date
      const hasConj = this.form.prenom_conj.trim() || this.form.nom_conj.trim();
      if (hasConj) {
        const conjDate = this.parseDate(this.form.jour_nais_conj, this.form.mois_nais_conj, this.form.annee_nais_conj);
        if (!conjDate) {
          this.errors['date_nais_conj'] = 'Date de naissance du conjoint invalide — format : JJ MM AAAA.';
        } else if (conjDate >= this.today()) {
          this.errors['date_nais_conj'] = 'La date de naissance du conjoint doit être dans le passé.';
        }
      }

      // Enfants : si nom renseigné, valider date
      [1, 2, 3].forEach(n => {
        const nomKey = `fils_nom${n}` as keyof typeof this.form;
        const dateKey = `fils_dat_nais${n}` as keyof typeof this.form;
        if ((this.form[nomKey] as string).trim()) {
          const d = this.parseDateStr(this.form[dateKey] as string);
          if (!d) {
            this.errors[`date_fils${n}`] = `Date de naissance de l'enfant ${n} invalide — format : JJ/MM/AAAA.`;
          } else if (d >= this.today()) {
            this.errors[`date_fils${n}`] = `La date de naissance de l'enfant ${n} doit être dans le passé.`;
          } else {
            const ageEnfant = (this.today().getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            if (ageEnfant >= 18) this.errors[`date_fils${n}`] = `L'enfant ${n} est majeur (18 ans ou plus) — ne pas inclure dans cette section.`;
          }
        }
      });
    }

    if (step === 2) {
      if (!this.form.num_pass.trim()) {
        this.errors['num_pass'] = 'Numéro de passeport obligatoire.';
      } else {
        const passRegex = /^[A-Z0-9]{6,9}$/i;
        if (!passRegex.test(this.form.num_pass.trim())) {
          this.errors['num_pass'] = 'Format invalide : 6 à 9 caractères alphanumériques (ex. AB1234567).';
        }
      }
      if (!this.form.deliv_par.trim()) this.errors['deliv_par'] = 'Autorité de délivrance obligatoire.';

      const deliv = this.passportDelivDate;
      if (!deliv) {
        this.errors['date_deliv'] = 'Date de délivrance invalide — format : JJ MM AAAA.';
      } else {
        if (deliv > this.today()) this.errors['date_deliv'] = 'La date de délivrance ne peut pas être dans le futur.';
        const maxAge = new Date(this.today()); maxAge.setFullYear(maxAge.getFullYear() - 10);
        if (deliv < maxAge) this.errors['date_deliv'] = 'Date de délivrance trop ancienne (> 10 ans).';
      }

      const exp = this.passportExpDate;
      if (!exp) {
        this.errors['date_exp'] = 'Date d\'expiration invalide — format : JJ MM AAAA.';
      } else {
        if (exp <= this.today()) {
          this.errors['date_exp'] = 'Votre passeport est expiré.';
        } else {
          const minFromToday = this.addMonths(this.today(), 6);
          if (exp < minFromToday) {
            this.errors['date_exp'] = `Le passeport doit être valide au moins 6 mois à compter d'aujourd'hui (jusqu'au ${this.formatDate(minFromToday)}).`;
          }
        }
        if (deliv && exp <= deliv) this.errors['date_exp'] = 'La date d\'expiration doit être postérieure à la date de délivrance.';
      }
    }

    if (step === 4) {
      if (this.form.type_visa === 'transit' && !this.form.destin_final.trim()) this.errors['destin_final'] = 'Destination finale obligatoire pour un visa de transit.';
      if (this.form.type_visa === 'transit' && !this.form.transit_visa_dest) this.errors['transit_visa_dest'] = 'Veuillez indiquer si vous êtes titulaire d\'un visa pour votre destination finale.';
      if (!this.form.visa_sollicite.trim()) this.errors['visa_sollicite'] = 'Champ obligatoire (ex : Tourisme — Algérie).';
      if (!this.form.motif_sejour.trim()) this.errors['motif_sejour'] = 'Motif de séjour obligatoire.';
      if (!this.form.adress_sejour.trim()) this.errors['adress_sejour'] = 'Adresse de séjour obligatoire.';
      if (!this.form.duree_sejour) this.errors['duree_sejour'] = 'Durée de séjour obligatoire.';

      const entree = this.entreeDate;
      if (!entree) {
        this.errors['date_entree'] = 'Date d\'entrée invalide — format : JJ MM AAAA.';
      } else if (entree <= this.today()) {
        this.errors['date_entree'] = 'La date d\'entrée doit être une date future.';
      } else {
        const exp = this.passportExpDate;
        if (exp) {
          if (entree >= exp) {
            this.errors['date_entree'] = 'Votre passeport expire avant la date d\'entrée.';
          } else {
            const minValid = this.addMonths(entree, 6);
            if (exp < minValid) {
              this.errors['date_entree'] = `Passeport insuffisant : doit être valide jusqu'au ${this.formatDate(minValid)} (6 mois après l'entrée).`;
            }
          }
        }
      }
    }

    return Object.keys(this.errors).length === 0;
  }

  hasError(key: string): boolean { return !!this.errors[key]; }

  // ─── Autocomplétion adresses (identique au rayon) ─────────────

  onAddressInput(key: string, value: string, countryCode?: string): void {
    clearTimeout(this.debounceTimers[key]);
    if (!value || value.trim().length < 3) {
      this.suggestions[key] = [];
      this.showSuggestions[key] = false;
      return;
    }
    const code = countryCode ?? this.form.pays_residence;
    const strict = !!countryCode;
    this.debounceTimers[key] = setTimeout(() => this.fetchSuggestions(key, value, code, strict), 400);
  }

  private async fetchSuggestions(key: string, query: string, countryCode: string, strict = false): Promise<void> {
    try {
      const q = encodeURIComponent(query.trim());
      const bias = this.getLocationBias(countryCode);
      const url = `https://photon.komoot.io/api/?q=${q}&limit=10&lang=fr${bias}`;
      const res = await fetch(url);
      const data = await res.json();
      let features: PhotonFeature[] = data?.features || [];
      if (strict) {
        features = features.filter(f => f.properties.countrycode?.toLowerCase() === countryCode.toLowerCase());
      }
      const features6 = features.slice(0, 6);
      this.suggestions[key] = features6;
      this.showSuggestions[key] = features6.length > 0;
      this.cdr.detectChanges();
    } catch (_) {
      this.suggestions[key] = [];
      this.showSuggestions[key] = false;
    }
  }

  private getLocationBias(countryCode: string): string {
    const coords: Record<string, [number, number]> = {
      dz: [28.034, 1.660],  fr: [46.228, 2.214],  ma: [31.792, -7.093],
      tn: [33.887, 9.538],  be: [50.504, 4.470],  ch: [46.818, 8.228],
      ca: [56.130, -106.35], es: [40.417, -3.704], it: [41.872, 12.567],
      de: [51.166, 10.452], nl: [52.133, 5.291],  gb: [51.507, -0.128],
      us: [37.090, -95.713], pt: [39.400, -8.225],
    };
    const c = coords[countryCode];
    return c ? `&lat=${c[0]}&lon=${c[1]}` : '';
  }

  formatSuggestion(s: PhotonFeature): string {
    const p = s.properties;
    const parts: string[] = [];
    if (p.housenumber && p.street) parts.push(`${p.housenumber} ${p.street}`);
    else if (p.street) parts.push(p.street);
    else if (p.name) parts.push(p.name);
    const cityPart = [p.postcode, p.city].filter(Boolean).join(' ');
    if (cityPart) parts.push(cityPart);
    if (p.state && !p.city) parts.push(p.state);
    if (p.country) parts.push(p.country);
    return parts.join(', ');
  }

  selectSuggestion(key: string, s: PhotonFeature): void {
    (this.form as Record<string, string>)[key] = this.formatSuggestion(s);
    this.suggestions[key] = [];
    this.showSuggestions[key] = false;
  }

  hideSuggestions(key: string): void {
    setTimeout(() => { this.showSuggestions[key] = false; }, 200);
  }

  hasSuggestions(key: string): boolean {
    return !!(this.showSuggestions[key] && this.suggestions[key]?.length > 0);
  }

  getSuggestionIcon(s: PhotonFeature): string {
    const val = s.properties.osm_value || '';
    const key = s.properties.osm_key || '';
    if (['hotel', 'hostel', 'motel', 'guest_house'].includes(val)) return '🏨';
    if (['restaurant', 'cafe', 'bar', 'fast_food'].includes(val)) return '🍽️';
    if (key === 'office' || val === 'commercial' || val === 'office') return '🏢';
    if (['city', 'town', 'village', 'suburb'].includes(val)) return '🏘️';
    return '📍';
  }

  // ─── Navigation ───────────────────────────────────────────────

  goHome(): void {
    this.router.navigate(['/tabs/home']);
  }

  goBack(): void {
    this.errors = {};
    this.stepAttempted = false;
    if (this.currentStep > 0) { this.currentStep--; }
    else { this.router.navigate(['/visa']); }
  }

  nextStep(): void {
    this.stepAttempted = true;
    if (!this.validateStep(this.currentStep)) return;
    this.stepAttempted = false;
    this.errors = {};
    if (this.currentStep < this.steps.length - 1) this.currentStep++;
  }

  isLastStep(): boolean { return this.currentStep === this.steps.length - 1; }

  // ─── Génération PDF ───────────────────────────────────────────

  async generatePdf(): Promise<void> {
    this.stepAttempted = true;
    if (!this.validateStep(this.currentStep)) return;
    if (this.travelAlertsStep4.length > 0) return;

    this.isGenerating = true;
    this.successMessage = '';
    try {
      const pdfBytes = await firstValueFrom(
        this.http.get('assets/formulaire_visa.pdf', { responseType: 'arraybuffer' })
      );
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pdfForm = pdfDoc.getForm();

      const set = (fieldName: string, value: string) => {
        try { pdfForm.getTextField(fieldName).setText(value || ''); } catch (_) {}
      };

      // Coche exclusive : une seule case par groupe + régénère les apparences pour éviter le rendu gris ambigu
      const checkGroup = (names: string[], selectedIdx: number) => {
        names.forEach((name, i) => {
          try {
            const box = pdfForm.getCheckBox(name);
            if (i === selectedIdx) box.check(); else box.uncheck();
            box.updateAppearances();
          } catch (_) {}
        });
      };

      // Identité
      set('nom', this.form.nom.toUpperCase());
      set('prenom', this.form.prenom);
      set('nom_jfille', this.form.nom_jfille.toUpperCase());
      set('pseudo', this.form.pseudo);
      set('dat_nais4', this.form.jour_nais);
      set('dat_nais5', this.form.mois_nais);
      set('dat_nais6', this.form.annee_nais);
      set('lieu_nais1', this.form.lieu_nais);
      set('pay_nais1', this.form.pays_nais);
      set('filsde', this.form.nom_pere);   // "fils/fille de [père]"
      set('et_de',  this.form.nom_mere);   // "et de [mère]"
      set('nationalite_origin', this.form.nationalite_origin);
      set('nationalite_actu', this.form.nationalite_actu);
      set('adress_perso', this.form.adress_perso);
      set('tel_perso', this.form.tel_perso);

      checkGroup(['case1', 'case2'], this.form.sexe === 'M' ? 0 : 1);
      const civilIdx: Record<string, number> = { celibataire: 0, marie: 1, divorce: 2, veuf: 3 };
      checkGroup(['case3', 'case4', 'case5', 'case6'], civilIdx[this.form.etat_civil] ?? 0);

      // Conjoint
      set('prenom_conj', this.form.prenom_conj);
      set('nom_conj', this.form.nom_conj.toUpperCase());
      set('dat_nais1', this.form.jour_nais_conj);
      set('dat_nais2', this.form.mois_nais_conj);
      set('dat_nais3', this.form.annee_nais_conj);
      set('pay_nais2', this.form.pays_nais_conj);
      set('nationalite_conj', this.form.nationalite_conj);

      // Enfants
      set('fils_nom1', this.form.fils_nom1); set('fils_nom2', this.form.fils_nom2); set('fils_nom3', this.form.fils_nom3);
      set('fils_dat_nais1', this.form.fils_dat_nais1); set('fils_dat_nais2', this.form.fils_dat_nais2); set('fils_dat_nais3', this.form.fils_dat_nais3);
      set('fils_lieu_nais1', this.form.fils_lieu_nais1); set('fils_lieu_nais2', this.form.fils_lieu_nais2); set('fils_lieu_nais3', this.form.fils_lieu_nais3);
      set('fils_nat_nais1', this.form.fils_nat_nais1); set('fils_nat_nais2', this.form.fils_nat_nais2); set('fils_nat_nais3', this.form.fils_nat_nais3);

      // Passeport — case7=Ordinaire, case8=Service/Diplomatique
      checkGroup(['case7', 'case8'], this.form.type_doc === 'ordinaire' ? 0 : 1);
      set('num_pass', this.form.num_pass.toUpperCase());
      set('dat_doc1', this.form.jour_deliv); set('date_doc2', this.form.mois_deliv); set('date_doc3', this.form.annee_deliv);
      set('dat_doc4', this.form.jour_exp); set('date_doc5', this.form.mois_exp); set('date_doc6', this.form.annee_exp);
      set('deliv_par', this.form.deliv_par);

      // Nombre d'entrées — case9=Une, case10=Double, case11=Multiple
      const entreesIdx: Record<string, number> = { une: 0, double: 1, multiple: 2 };
      checkGroup(['case9', 'case10', 'case11'], entreesIdx[this.form.nbre_entrees] ?? 0);

      // Profession
      set('prof', this.form.prof); set('employeur', this.form.employeur);
      set('adress_prof', this.form.adress_prof); set('tel_prof', this.form.tel_prof);

      // Voyage
      set('destin_final', this.form.destin_final);
      // case12=Court séjour, case13=Long séjour (Transit = case15)
      const isTransit = this.form.type_visa === 'transit';
      checkGroup(['case12', 'case13'], isTransit ? -1 : (this.form.type_visa === 'court' ? 0 : 1));
      set('adress_sejour', this.form.adress_sejour);
      set('adres_sej2', this.form.adres_sej2);
      // Motif : case14=Tourisme, case15=Transit
      checkGroup(['case14', 'case15'], isTransit ? 1 : 0);
      set('motif_sejour', isTransit ? 'transit' : 'tourisme');
      set('autre2', this.form.autre_motif);
      set('date_ent1', this.form.jour_entree); set('date_ent2', this.form.mois_entree); set('date_ent3', this.form.annee_entree);
      // Durée du séjour (case16/17 = Oui/Non visa destination finale pour transit)
      set('nbre_comb', String(this.form.duree_sejour || ''));
      // Précédents séjours : date et nombre de séjours
      set('date_hitor', this.form.date_dernier_sejour);
      set('comb', String(this.form.nbre_sejours_prec || ''));

      // Transit — visa pour destination finale : case16=Oui, case17=Non
      checkGroup(
        ['case16', 'case17'],
        this.form.transit_visa_dest === 'oui' ? 0 : this.form.transit_visa_dest === 'non' ? 1 : -1
      );

      const filledBytes = await pdfDoc.save() as Uint8Array<ArrayBuffer>;
      this.generatedPdfFilename = `formulaire_visa_${this.form.nom}_${this.form.prenom}.pdf`;
      this.generatedPdfBytes = filledBytes;
      this.successMessage = 'Formulaire prêt !';
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération du PDF.');
    } finally {
      this.isGenerating = false;
    }
  }

  private downloadPdf(bytes: Uint8Array<ArrayBuffer>, filename: string): void {
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  downloadGeneratedPdf(): void {
    if (this.generatedPdfBytes) {
      this.downloadPdf(this.generatedPdfBytes, this.generatedPdfFilename);
    }
  }

  async sharePdf(): Promise<void> {
    if (!this.generatedPdfBytes) return;
    const file = new File(
      [this.generatedPdfBytes.buffer as ArrayBuffer],
      this.generatedPdfFilename,
      { type: 'application/pdf' }
    );
    try {
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Formulaire de visa Algérie',
          text: 'Mon formulaire de demande de visa pour l\'Algérie',
          files: [file]
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Formulaire de visa Algérie',
          text: 'Mon formulaire de demande de visa pour l\'Algérie — GoDZ'
        });
      } else {
        this.downloadPdf(this.generatedPdfBytes, this.generatedPdfFilename);
      }
    } catch (_) {}
  }

  shareViaEmail(): void {
    const subject = encodeURIComponent('Formulaire de demande de visa Algérie');
    const body = encodeURIComponent(
      'Bonjour,\n\nVeuillez trouver ci-joint mon formulaire de demande de visa pour l\'Algérie.\n\nCordialement'
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  shareViaWhatsApp(): void {
    const text = encodeURIComponent('📋 Formulaire de visa Algérie prérempli via GoDZ');
    window.open(`https://wa.me/?text=${text}`);
  }

  downloadBlankPdf(): void {
    const a = document.createElement('a');
    a.href = 'assets/formulaire_visa.pdf';
    a.download = 'formulaire_visa.pdf';
    a.click();
  }
}
