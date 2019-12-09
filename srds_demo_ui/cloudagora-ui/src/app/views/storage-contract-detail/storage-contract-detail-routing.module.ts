import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StorageContractDetailComponent } from './storage-contract-detail.component';

const routes: Routes = [
  {
    path: '',
    component: StorageContractDetailComponent,
    data: {
      title: 'Storage Contract Details'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class StorageContractDetailRoutingModule {}
