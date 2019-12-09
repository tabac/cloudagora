import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ButtonsModule as BsButtonsModule } from 'ngx-bootstrap/buttons';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatCardModule} from '@angular/material';

import { CommonModule } from '@angular/common';
import { ButtonsModule } from '../buttons/buttons.module';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsComponent } from './settings.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SettingsRoutingModule,
    BsDropdownModule,
    BsButtonsModule.forRoot(),
    ButtonsModule,
    MatProgressSpinnerModule,
    MatCardModule,
    TabsModule.forRoot()
  ],
  declarations: [ SettingsComponent ]
})

export class SettingsModule { }
