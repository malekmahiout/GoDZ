import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadChildren: () => import('../pages/home/home.module').then(m => m.HomePageModule)
      },
{
        path: 'map',
        loadChildren: () => import('../pages/map/map.module').then(m => m.MapPageModule)
      },
      {
        path: 'carte',
        loadChildren: () => import('../pages/carte/carte.module').then(m => m.CartePageModule)
      },
      {
        path: 'favorites',
        loadChildren: () => import('../pages/favorites/favorites.module').then(m => m.FavoritesPageModule)
      },
      {
        path: 'itinerary',
        loadChildren: () => import('../pages/itinerary/itinerary.module').then(m => m.ItineraryPageModule)
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
