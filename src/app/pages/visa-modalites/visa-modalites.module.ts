import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../../shared/shared.module';
import { VisaModalitesPage } from './visa-modalites.page';

const routes: Routes = [{ path: '', component: VisaModalitesPage }];

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes), SharedModule],
  declarations: [VisaModalitesPage]
})
export class VisaModalitesPageModule {}
