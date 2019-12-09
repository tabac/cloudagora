import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartsModule } from 'ng2-charts';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material';

import { CommonModule } from '@angular/common';
import { AuctionDetailRoutingModule } from './auction-detail-routing.module';
import { AuctionDetailComponent } from './auction-detail.component';
import { TabsModule } from 'ngx-bootstrap/tabs';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    AuctionDetailRoutingModule,
    ChartsModule,
    BsDropdownModule,
    ButtonsModule.forRoot(),
    MatProgressSpinnerModule,
    MatCardModule,
    TabsModule.forRoot(),
  ],
  declarations: [ AuctionDetailComponent ]
})
export class AuctionDetailModule { }
