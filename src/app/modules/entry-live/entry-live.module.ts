import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { NgxEchartsModule } from 'shared/ngx-echarts/ngx-echarts.module';

import { routing } from './entry-live.routes';
import { EntryLiveViewComponent } from './entry-live-view.component';
import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule, InputHelperModule, KalturaUIModule, TagsModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { TableModule } from 'primeng/table';
import { EntryDetailsComponent } from './views/entry-details/entry-details.component';
import { LivePlayerComponent } from './views/live-player/live-player.component';
import { LiveStatusComponent } from './views/live-status/live-status.component';
import { EntryLiveService } from './entry-live.service';
import { StreamStatePipe } from './pipes/stream-state.pipe';
import { WidgetsManager } from './widgets/widgets-manager';
import { LiveUsersComponent } from './views/live-users/live-users.component';
import { LiveBandwidthComponent } from './views/live-bandwidth/live-bandwidth.component';
import { LiveStreamHealthComponent } from './views/live-stream-health/live-stream-health.component';
import { CodeToSeverityPipe } from './views/live-stream-health/pipes/code-to-severity.pipe';
import { SeverityToHealthPipe } from './views/live-stream-health/pipes/severity-to-health.pipe';
import { NotificationTitlePipe } from './views/live-stream-health/pipes/notification-title.pipe';
import { CodeToHealthIconPipe } from './views/live-stream-health/pipes/code-to-health-icon.pipe';
import { EntryLiveGeneralPollsService } from './providers/entry-live-general-polls.service';
import { EntryLiveGeoDevicesPollsService } from './providers/entry-live-geo-devices-polls.service';
import { LiveGeoComponent } from './views/live-geo/live-geo.component';
import { LiveGeoConfig } from './views/live-geo/live-geo.config';
import { LiveDevicesComponent } from './views/live-devices/live-devices.component';
import { LiveDevicesConfig } from './views/live-devices/live-devices.config';
import { LiveDiscoveryComponent } from './views/live-discovery-chart/live-discovery.component';
import { EntryLiveDiscoveryPollsService } from './providers/entry-live-discovery-polls.service';
import { FiltersComponent } from './views/live-discovery-chart/filters/filters.component';
import { FiltersService } from './views/live-discovery-chart/filters/filters.service';
import { LiveDiscoveryConfig } from './views/live-discovery-chart/live-discovery.config';
import { MetricsSelectorComponent } from './views/live-discovery-chart/metrics-selector/metrics-selector.component';
import { MetricsSelectorDropdownComponent } from './views/live-discovery-chart/metrics-selector/metrics-selector-dropdown/metrics-selector-dropdown.component';
import { DiscoveryChartComponent } from './views/live-discovery-chart/discovery-chart/discovery-chart.component';
import { LiveDiscoveryTableComponent } from './views/live-discovery-table/live-discovery-table.component';
import { LiveDiscoveryDevicesTableConfig } from './views/live-discovery-table/devices-table/live-discovery-devices-table.config';
import { DiscoveryFilterComponent } from './views/live-discovery-table/filter/filter.component';
import { UsersFilterComponent } from './views/live-discovery-table/filter/users-filter/users-filter.component';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { TableSelectorComponent } from './views/live-discovery-table/table-selector/table-selector.component';
import { DevicesTableComponent } from './views/live-discovery-table/devices-table/devices-table.component';
import { UsersTableComponent } from './views/live-discovery-table/users-table/users-table.component';
import { LiveDiscoveryDevicesTableProvider } from './views/live-discovery-table/devices-table/live-discovery-devices-table-provider';
import { LiveDiscoveryUsersTableProvider } from './views/live-discovery-table/users-table/live-discovery-users-table-provider';
import { LiveDiscoveryUsersTableConfig } from './views/live-discovery-table/users-table/live-discovery-users-table.config';
import { LiveDiscoveryUsersStatusConfig } from './views/live-discovery-table/users-table/live-discovery-users-status.config';
import { StatusBulletComponent } from './views/live-discovery-table/users-table/status-bullet/status-bullet.component';
import { TimeSelectorComponent } from './views/live-discovery-chart/time-selector/time-selector.component';
import { ToggleLiveComponent } from './components/toggle-live/toggle-live.component';
import { SelectButtonModule } from 'primeng/selectbutton';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CalendarModule } from 'primeng/calendar';
import { ToggleUsersModeComponent } from './components/toggle-users-mode/toggle-users-mode.component';
import { ToggleUsersModeService } from './components/toggle-users-mode/toggle-users-mode.service';

@NgModule({
  imports: [
    AreaBlockerModule,
    TagsModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    DropdownModule,
    ButtonModule,
    PaginatorModule,
    SharedModule,
    TableModule,
    TooltipModule,
    NgxEchartsModule,
    RouterModule.forChild(routing),
    KalturaUIModule,
    InputHelperModule,
    SelectButtonModule,
    AutoCompleteModule,
    RadioButtonModule,
    CalendarModule,
  ],
  declarations: [
    EntryLiveViewComponent,
    EntryDetailsComponent,
    LivePlayerComponent,
    LiveStatusComponent,
    StreamStatePipe,
    LiveUsersComponent,
    LiveBandwidthComponent,
    LiveStreamHealthComponent,
    CodeToSeverityPipe,
    SeverityToHealthPipe,
    NotificationTitlePipe,
    CodeToHealthIconPipe,
    LiveGeoComponent,
    LiveDevicesComponent,
    LiveDiscoveryComponent,
    FiltersComponent,
    MetricsSelectorComponent,
    MetricsSelectorDropdownComponent,
    DiscoveryChartComponent,
    LiveDiscoveryTableComponent,
    DiscoveryFilterComponent,
    UsersFilterComponent,
    TableSelectorComponent,
    DevicesTableComponent,
    UsersTableComponent,
    StatusBulletComponent,
    TimeSelectorComponent,
    ToggleLiveComponent,
    ToggleUsersModeComponent,
  ],
  providers: [
    CodeToSeverityPipe,
    SeverityToHealthPipe,
    WidgetsManager,
    EntryLiveService,
    LiveGeoConfig,
    LiveDevicesConfig,
    FiltersService,
    LiveDiscoveryConfig,
    LiveDiscoveryDevicesTableConfig,
    LiveDiscoveryUsersTableConfig,
    LiveDiscoveryDevicesTableProvider,
    LiveDiscoveryUsersTableProvider,
    LiveDiscoveryUsersStatusConfig,
    ToggleUsersModeService,
    
    // polls services
    EntryLiveGeneralPollsService,
    EntryLiveGeoDevicesPollsService,
    EntryLiveDiscoveryPollsService,
  ]
})
export class EntryLiveModule {
}
