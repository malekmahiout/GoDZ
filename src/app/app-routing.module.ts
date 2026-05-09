import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs/home',
    pathMatch: 'full'
  },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'place/:id',
    loadChildren: () => import('./pages/place-detail/place-detail.module').then(m => m.PlaceDetailPageModule)
  },
  {
    path: 'category/:cat',
    loadChildren: () => import('./pages/category-list/category-list.module').then(m => m.CategoryListPageModule)
  },
  {
    path: 'visa',
    loadChildren: () => import('./pages/visa/visa.module').then(m => m.VisaPageModule)
  },
  {
    path: 'visa-form',
    loadChildren: () => import('./pages/visa-form/visa-form.module').then(m => m.VisaFormPageModule)
  },
  {
    path: 'visa-modalites',
    loadChildren: () => import('./pages/visa-modalites/visa-modalites.module').then(m => m.VisaModalitesPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
