import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CheckboxModule } from 'primeng/checkbox';
import { CalendarModule } from 'primeng/calendar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { RadioButtonModule } from 'primeng/radiobutton';

import { DateFilterComponent } from './components/date-filter/date-filter.component';
import { DateFilterService } from './components/date-filter/date-filter.service';
import { UsersFilterComponent } from './components/users-filter/users-filter.component';
import { ExportCsvComponent } from './components/export-csv/export-csv.component';
import { BulletComponent } from './components/bullet/bullet.component';
import { ReportService } from './services/report.service';
import { ReportTabsComponent } from './components/report-tabs/report-tabs.component';
import { TranslateModule } from '@ngx-translate/core';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { PopupWidgetModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { TimeUnitsComponent } from './components/date-filter/time-units.component';
import { CompareService } from 'shared/services/compare.service';
import { TrendPipe } from 'shared/pipes/trend.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    CheckboxModule,
    SelectButtonModule,
    CalendarModule,
    RadioButtonModule,
    PopupWidgetModule,
    TooltipModule,
    AutoCompleteModule
  ],
  declarations: [
    DateFilterComponent,
    UsersFilterComponent,
    ReportTabsComponent,
    ExportCsvComponent,
    BulletComponent,
    TimeUnitsComponent,
    TrendPipe
  ],
  exports: [
    DateFilterComponent,
    UsersFilterComponent,
    ReportTabsComponent,
    ExportCsvComponent,
    BulletComponent,
    TimeUnitsComponent,
    TrendPipe
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
        ReportService,
        CompareService,
      ]
    };
  }
}
