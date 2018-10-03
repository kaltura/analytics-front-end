import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { RadioButtonModule } from 'primeng/radiobutton';

import { DateFilterComponent } from './components/date-filter/date-filter.component';
import { DateFilterService } from './components/date-filter/date-filter.service';
import { UsersFilterComponent } from './components/users-filter/users-filter.component';
import { ReportService } from './services/report.service';
import { ReportTabsComponent } from './components/report-tabs/report-tabs.component';
import { TranslateModule } from '@ngx-translate/core';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { PopupWidgetModule } from '@kaltura-ng/kaltura-ui';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    DropdownModule,
    SelectButtonModule,
    CalendarModule,
    RadioButtonModule,
    PopupWidgetModule,
    AutoCompleteModule
  ],
  declarations: [
    DateFilterComponent,
    UsersFilterComponent,
    ReportTabsComponent
  ],
  exports: [
    DateFilterComponent,
    UsersFilterComponent,
    ReportTabsComponent
  ],
  providers: [
  ]
})

export class SharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedModule,
      providers: <any[]>[
        DateFilterService,
        ReportService
      ]
    };
  }
}
