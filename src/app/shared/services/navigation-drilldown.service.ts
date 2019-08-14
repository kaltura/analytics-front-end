import { Injectable, OnDestroy } from '@angular/core';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig } from "configuration/analytics-config";
import { BrowserService } from 'shared/services/browser.service';
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "shared/services/auth.service";
import { cancelOnDestroy, tag } from "@kaltura-ng/kaltura-common";
import { KalturaAPIException } from "kaltura-ngx-client";
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class NavigationDrillDownService implements OnDestroy {

  constructor(private _frameEventManager: FrameEventManagerService,
              private _browserService: BrowserService,
              private _activatedRoute: ActivatedRoute,
              private _translate: TranslateService,
              private _authService: AuthService,
              private _router: Router) {
  }

  private _partnerSwitchInProgress = false;

  public drilldown(route: string, id: string, includeQueryParams = false, partnerId?: string): void {
    if (partnerId && this._authService.pid.toString() !== partnerId.toString() && !this._partnerSwitchInProgress) {
      this._partnerSwitchInProgress = true;
      this._authService.switchPartner(parseInt(partnerId))
        .pipe(cancelOnDestroy(this))
        .pipe(tag('block-shell'))
        .subscribe(
          (success: boolean) => {
            if (success) {
              this._partnerSwitchInProgress = false;
              this._doDrillDown(route, id, includeQueryParams);
            }
          },
          (error: KalturaAPIException) => {
            this._partnerSwitchInProgress = false;
            this._browserService.alert({
              header: this._translate.instant('app.common.error'),
              message: this._translate.instant('app.entry.accountError', {'0': partnerId}),
            });
          }
        );
    } else {
      if (!this._partnerSwitchInProgress) {
        this._doDrillDown(route, id, includeQueryParams);
      }
    }
  }

  private _doDrillDown(route: string, id: string, includeQueryParams: boolean): void {
    if (analyticsConfig.isHosted) {
      const params = includeQueryParams ? this._browserService.getCurrentQueryParams('string') : '';
      this._frameEventManager.publish(FrameEvents.NavigateTo, `/analytics/${route}?id=${id}&${params}`);
    } else {
      this._router.navigate([route, id], (includeQueryParams ? { queryParams: this._activatedRoute.snapshot.queryParams } : null));
    }
  }

  public navigateBack(route: string, includeQueryParams: boolean): void {
    this._authService.restoreParentIfNeeded();
    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(FrameEvents.NavigateBack);
    } else {
      this._router.navigate([route], (includeQueryParams ? { queryParams: this._activatedRoute.snapshot.queryParams } : null));
    }
  }

  ngOnDestroy() {}

}

