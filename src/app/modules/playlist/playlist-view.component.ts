import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
  KalturaAPIException,
  KalturaClient,
  KalturaDetachedResponseProfile,
  KalturaMultiRequest,
  KalturaMultiResponse,
  KalturaPlaylist,
  KalturaPlaylistType,
  KalturaRequestOptions,
  KalturaResponseProfileType,
  KalturaUser,
  PlaylistGetAction,
  UserGetAction
} from 'kaltura-ngx-client';
import {cancelOnDestroy} from '@kaltura-ng/kaltura-common';
import {FrameEventManagerService, FrameEvents} from 'shared/modules/frame-event-manager/frame-event-manager.service';
import {analyticsConfig} from 'configuration/analytics-config';
import {map} from 'rxjs/operators';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {AuthService, ErrorsManagerService, NavigationDrillDownService} from 'shared/services';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-playlist',
  templateUrl: './playlist-view.component.html',
  styleUrls: ['./playlist-view.component.scss'],
})
export class PlaylistViewComponent implements OnInit, OnDestroy {
  public _playlistViewConfig = analyticsConfig.viewsConfig.playlist;
  public _loadingPlaylist = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _playlist: KalturaPlaylist;
  public _playlistId = '';
  public _owner = '';
  public _isChildAccount = false;
  public _interactiveVideo = false;
  public _isManualPlaylist = false;
  public _isRuleBasedPlaylist = false;

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
        this._playlistId = params['id'];
        if (this._playlistId) {
          this._loadPlaylistDetails();
        }
      });
  }

  ngOnDestroy() {
  }

  private _loadPlaylistDetails(): void {
    this._loadingPlaylist = true;
    this._blockerMessage = null;

    const request = new KalturaMultiRequest(
      new PlaylistGetAction({ id: this._playlistId })
        .setRequestOptions({
          responseProfile: new KalturaDetachedResponseProfile({
            type: KalturaResponseProfileType.includeFields,
            fields: 'id,name,playlistType,createdAt,updatedAt,userId,adminTags'
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
            // do not block view for invalid users. could be a deleted user but we still have the entry Analytics data.
            if (err.code !== "INVALID_USER_ID") {
              throw err;
            }
          }

          return [
            responses[0].result,
            responses[1].result,
          ] as [KalturaPlaylist, KalturaUser ];
        })
      )
      .subscribe(
        ([playlist, user]) => {
          this._playlist = playlist;
          this._interactiveVideo = (playlist.adminTags && playlist.adminTags.split(',').indexOf('raptentry') > -1) || playlist.playlistType === KalturaPlaylistType.path ? true : false;
          this._owner = user && user.fullName ? user.fullName : playlist.userId; // fallback for deleted users
          this._isManualPlaylist = playlist.playlistType === KalturaPlaylistType.staticList;
          this._isRuleBasedPlaylist = playlist.playlistType === KalturaPlaylistType.dynamic;
          this._loadingPlaylist = false;
        },
        error => {
          this._loadingPlaylist = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._loadPlaylistDetails();
            }
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }

  public _back(): void {
    this._navigationDrillDownService.navigateBack('audience/engagement', true);
  }

  public _navigateToPlaylist(): void {
    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(FrameEvents.NavigateTo, '/content/playlists/playlist/' + this._playlistId);
    }
  }

}
