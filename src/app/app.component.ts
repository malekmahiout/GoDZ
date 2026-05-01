import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { App } from '@capacitor/app';
import { TranslationService } from './services/translation.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private translationService: TranslationService,
    private navCtrl: NavController
  ) {}

  ngOnInit(): void {
    this.translationService.setLanguage('fr');
    App.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
      if (canGoBack) {
        this.navCtrl.back();
      } else {
        App.exitApp();
      }
    });
  }
}
