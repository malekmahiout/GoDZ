import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from '../../shared/shared.module';
import { VisaFormPage } from './visa-form.page';

const routes: Routes = [
  { path: '', component: VisaFormPage }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes), HttpClientModule, SharedModule],
  declarations: [VisaFormPage]
})
export class VisaFormPageModule {}
