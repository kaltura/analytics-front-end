import { Injectable, OnDestroy } from '@angular/core';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { KalturaAPIException, KalturaClient, KalturaMultiResponse, KalturaSessionType, PartnerGetAction, PartnerGetInfoAction, SessionImpersonateAction } from "kaltura-ngx-client";
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { Observable } from "rxjs";
import { switchMap } from 'rxjs/operators';

@Injectable()
export class AuthService implements OnDestroy {

    public set ks(value: string) {
      this._ks = value;
    }
    public get ks(): string {
      return this._ks;
    }

    public set pid(value: string) {
      this._pid = value;
    }
    public get pid(): string {
      return this._pid;
    }

    public set partnerCreatedAt(value: string) {
      this._partnerCreatedAt = value;
    }
    public get partnerCreatedAt(): string {
      return this._partnerCreatedAt;
    }

    public isChildAccount = false;

    private _ks: string = null; // current ks
    private _parentKs = null;   // parent ks for multi account
    private _pid = null;        // current partner id
    private _parentPid = null;  // parent partner id for multi account
    private _partnerCreatedAt = null;  // partner creation date

    constructor(private _frameEventManager: FrameEventManagerService,
                private _kalturaServerClient: KalturaClient,
                private _logger: KalturaLogger) {
      this._logger = _logger.subLogger('AuthService');
    }

    public logout(): void {
      this._logger.info('Send logout event to the host app');
      this._frameEventManager.publish(FrameEvents.Logout);
    }

    public restoreParentIfNeeded(): void {
      this.isChildAccount = false;

      if (this._parentPid) {
        this._pid = this._parentPid;
        this._parentPid = null;
      }

      if (this._parentKs) {
        this._ks = this._parentKs;
        this._parentKs = null;

        // update Kaltura client lib ks
        this._kalturaServerClient.setDefaultRequestOptions({
          ks: this._ks,
          partnerId: this._pid
        });
      }
    }

    public switchPartner(newPartnerId: number): Observable<boolean> {
      return Observable.create(
        observer => {
          this._getAdminSession(newPartnerId)
            .pipe(cancelOnDestroy(this))
            .subscribe(
              ks => {

                this._logger.info(`handle successful switchPartner request by user`);
                this._parentKs = this._ks;            // save parent KS
                this._parentPid = this._pid;          // save parent pid
                this._ks = ks;                        // update ks to the child partner ks
                this._pid = newPartnerId.toString();  // update pid to the child partner id

                // update Kaltura client lib ks
                this._kalturaServerClient.setDefaultRequestOptions({
                  ks: this._ks,
                  partnerId: this._pid
                });

                this.isChildAccount = true;

                observer.next(true);
                observer.complete();
              },
              (error: KalturaAPIException) => {
                this._logger.warn(`handle failed switchPartner request by user, show confirmation`, { errorMessage: error.message });
                observer.error(error);
              }
            );

        });
    }

    private _getAdminSession(impersonatedPartnerId: number): Observable<string> {
      const loggedInUserId = this._pid;
      const requests = [
        new PartnerGetInfoAction({})
          .setRequestOptions({
            ks: this._ks
          }),
        new PartnerGetAction({ id: impersonatedPartnerId })
          .setRequestOptions({
            ks: this._ks
          })];

      return this._kalturaServerClient.multiRequest(requests).pipe(switchMap(
        (responses: KalturaMultiResponse) => {
          if (responses.hasErrors()) {
            throw new Error(`Error occur during session creation for partner ${impersonatedPartnerId}`);
          }
          return this._kalturaServerClient.request(new SessionImpersonateAction({
            secret: responses[0].result.adminSecret,
            userId: responses[1].result.adminUserId,
            impersonatedPartnerId,
            type: KalturaSessionType.admin,
            partnerId: this._pid,
            privileges: loggedInUserId !== responses[1].result.adminUserId ? `disableentitlement,enablechangeaccount:${impersonatedPartnerId}` : 'disableentitlement'

          }));
        }
      ));
    }

    ngOnDestroy(): void {}
}

