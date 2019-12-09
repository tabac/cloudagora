import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ComputeContractDetailComponent } from './compute-contract-detail.component';

const routes: Routes = [
  {
    path: '',
    component: ComputeContractDetailComponent,
    data: {
      title: 'Compute Contract Details'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class ComputeContractDetailRoutingModule {}
