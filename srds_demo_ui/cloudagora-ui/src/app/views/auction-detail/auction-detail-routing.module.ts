import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuctionDetailComponent } from './auction-detail.component';

const routes: Routes = [
  {
    path: '',
    component: AuctionDetailComponent,
    data: {
      title: 'Auction Details'
    },
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuctionDetailRoutingModule {}
