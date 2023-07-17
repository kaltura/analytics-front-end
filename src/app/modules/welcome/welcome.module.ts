import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { routing } from './welcome.routes';
import { AreaBlockerModule, KalturaUIModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { TableModule } from 'primeng/table';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'shared/shared.module';
import { PaginatorModule } from 'primeng/paginator';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ButtonModule } from 'primeng/button';
import {WelcomeComponent} from "./welcome.component";
import {SearchTermsComponent} from "./views/search-terms/search-terms.component";
import { SelectButtonModule } from 'primeng/selectbutton';

@NgModule({
  imports: [
    CommonModule,
    ButtonModule,
    RouterModule.forChild(routing),
    SelectButtonModule,
    KalturaUIModule,
    SharedModule,

    TableModule,
    OverlayPanelModule,
    PaginatorModule,
    TranslateModule,
    AreaBlockerModule,
    TooltipModule,
  ],
  declarations: [
    WelcomeComponent,
    SearchTermsComponent
  ],
  providers: []
})
export class WelcomeModule {
}
