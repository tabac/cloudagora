import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartsModule } from 'ng2-charts';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ButtonsModule as BsButtonsModule } from 'ngx-bootstrap/buttons';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatCardModule} from '@angular/material';

import { CommonModule } from '@angular/common';
import { StorageContractDetailComponent } from './storage-contract-detail.component';
import { StorageContractDetailRoutingModule } from './storage-contract-detail-routing.module';
import { ButtonsModule } from '../buttons/buttons.module';
import { TabsModule } from 'ngx-bootstrap/tabs';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    StorageContractDetailRoutingModule,
    ChartsModule,
    BsDropdownModule,
    BsButtonsModule.forRoot(),
    ButtonsModule,
    MatProgressSpinnerModule,
    MatCardModule,
    TabsModule.forRoot()
  ],
  declarations: [ StorageContractDetailComponent ]
})

export class StorageContractDetailModule { }
