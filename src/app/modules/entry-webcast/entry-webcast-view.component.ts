import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BaseEntryGetAction,
  KalturaAPIException,
  KalturaClient,
  KalturaDetachedResponseProfile, KalturaLiveEntry,
  KalturaMultiRequest,
  KalturaMultiResponse,
  KalturaRequestOptions,
  KalturaResponseProfileType,
  KalturaUser,
  UserGetAction
} from 'kaltura-ngx-client';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { map } from 'rxjs/operators';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, NavigationDrillDownService } from 'shared/services';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-entry-webcast',
  templateUrl: './entry-webcast-view.component.html',
  styleUrls: ['./entry-webcast-view.component.scss'],
})
export class EntryWebcastViewComponent implements OnInit, OnDestroy {
  public _entryViewConfig = analyticsConfig.viewsConfig.entry;
  public _loadingEntry = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _entry: KalturaLiveEntry;
  public _entryId = '';
  public _owner = '';
  public _isChildAccount = false;

  constructor(private _router: Router,
              private _route: ActivatedRoute,
              private _translate: TranslateService,
              private _kalturaClient: KalturaClient,
              private _errorsManager: ErrorsManagerService,
              private _frameEventManager: FrameEventManagerService,
              private _navigationDrillDownService: NavigationDrillDownService,
              private _authService: AuthService) {
  }

  ngOnInit() {
    this._isChildAccount = this._authService.isChildAccount;
    this._route.params
      .pipe(cancelOnDestroy(this))
      .subscribe(params => {
        this._entryId = params['id'];
        if (this._entryId) {
          this._loadEntryDetails();
        }
      });
  }

  ngOnDestroy() {
  }

  private _loadEntryDetails(): void {
    this._loadingEntry = true;
    this._blockerMessage = null;

    const request = new KalturaMultiRequest(
      new BaseEntryGetAction({ entryId: this._entryId })
        .setRequestOptions({
          responseProfile: new KalturaDetachedResponseProfile({
            type: KalturaResponseProfileType.includeFields,
            fields: 'id,name,mediaType,createdAt,msDuration,userId,thumbnailUrl,displayInSearch'
          })
        }),
      new UserGetAction({ userId: null })
        .setDependency(['userId', 0, 'userId'])
        .setRequestOptions(
          new KalturaRequestOptions({
            responseProfile: new KalturaDetachedResponseProfile({
              type: KalturaResponseProfileType.includeFields,
              fields: 'id,fullName'
            })
          })
        )
    );

    this._kalturaClient
      .multiRequest(request)
      .pipe(
        cancelOnDestroy(this),
        map((responses: KalturaMultiResponse) => {
          if (responses.hasErrors()) {
            const err: KalturaAPIException = responses.getFirstError();
            // do not block view for invalid users. could be a deleted user but we still have the entry Analytics data. Also support KMS weak KS.
            if (err.code !== "INVALID_USER_ID" && err.code !== "CANNOT_RETRIEVE_ANOTHER_USER_USING_NON_ADMIN_SESSION") {
              throw err;
            }
          }

          return [
            responses[0].result,
            responses[1].result
          ] as [KalturaLiveEntry, KalturaUser];
        })
      )
      .subscribe(
        ([entry, user]) => {
          this._entry = entry;
          this._owner = user && user.fullName ? user.fullName : entry.userId; // fallback for deleted users
          this._loadingEntry = false;
        },
        error => {
          this._loadingEntry = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._loadEntryDetails();
            }
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }

  public _back(): void {
    this._navigationDrillDownService.navigateBack('audience/engagement', true);
  }

  public _navigateToEntry(): void {
    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(FrameEvents.NavigateTo, '/content/entries/entry/' + this._entryId);
    }
  }
}
