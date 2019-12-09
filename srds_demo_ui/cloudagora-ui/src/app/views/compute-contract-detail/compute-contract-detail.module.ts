import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartsModule } from 'ng2-charts';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ButtonsModule as BsButtonsModule } from 'ngx-bootstrap/buttons';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatCardModule} from '@angular/material';

import { CommonModule } from '@angular/common';
import { ComputeContractDetailComponent } from './compute-contract-detail.component';
import { ComputeContractDetailRoutingModule } from './compute-contract-detail-routing.module';
import { ButtonsModule } from '../buttons/buttons.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TabsModule } from 'ngx-bootstrap/tabs';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ComputeContractDetailRoutingModule,
    ChartsModule,
    BsDropdownModule,
    BsButtonsModule.forRoot(),
    ButtonsModule,
    MatProgressSpinnerModule,
    MatCardModule,
    TabsModule.forRoot()
  ],
  declarations: [ ComputeContractDetailComponent ]
})

export class ComputeContractDetailModule { }
