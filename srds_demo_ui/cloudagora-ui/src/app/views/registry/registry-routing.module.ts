import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RegistryComponent } from './registry.component';

const routes: Routes = [
  {
    path: '',
    component: RegistryComponent,
    data: {
      title: 'Registry'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class RegistryRoutingModule {}
