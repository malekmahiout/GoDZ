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
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
