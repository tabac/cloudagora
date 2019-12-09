import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ButtonsModule as BsButtonsModule } from 'ngx-bootstrap/buttons';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatCardModule} from '@angular/material';

import { CommonModule } from '@angular/common';
import { ButtonsModule } from '../buttons/buttons.module';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { RegistryComponent } from './registry.component';
import { RegistryRoutingModule } from './registry-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RegistryRoutingModule,
    BsDropdownModule,
    BsButtonsModule.forRoot(),
    ButtonsModule,
    MatProgressSpinnerModule,
    MatCardModule,
    TabsModule.forRoot()
  ],
  declarations: [ RegistryComponent ]
})

export class RegistryModule { }
