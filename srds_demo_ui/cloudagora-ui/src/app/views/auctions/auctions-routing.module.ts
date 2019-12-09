import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuctionsComponent } from './auctions.component';

const routes: Routes = [
  {
    path: '',
    component: AuctionsComponent,
    data: {
      title: 'Active Auctions'
    },
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuctionsRoutingModule {}
