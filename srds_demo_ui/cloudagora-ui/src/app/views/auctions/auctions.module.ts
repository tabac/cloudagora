import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartsModule } from 'ng2-charts';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material';

import { CommonModule } from '@angular/common';
import { AuctionsRoutingModule } from './auctions-routing.module';
import { AuctionsComponent } from './auctions.component';
import { TabsModule } from 'ngx-bootstrap/tabs';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    AuctionsRoutingModule,
    ChartsModule,
    BsDropdownModule,
    MatProgressSpinnerModule,
    MatCardModule,
    ButtonsModule.forRoot(),
    TabsModule.forRoot(),
  ],
  declarations: [ AuctionsComponent ]
})
export class AuctionsModule { }
