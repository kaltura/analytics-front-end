import { Injectable } from '@angular/core';
import { KalturaClient } from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from "./auth.service";
import { analyticsConfig } from 'configuration/analytics-config';
import { HttpClient } from "@angular/common/http";

export enum EventType
{
    ButtonClicked = 10002,
    PageLoad = 10003
}

export enum ApplicationType
{
    KMC = 0,
    Analytics = 13
}

export enum PageType
{
    View = 1,
    Create = 2,
    Edit = 3,
    Participate = 4,
    List = 5,
    Analytics = 6,
    Admin = 7,
    Error = 8,
    Login = 9,
    Registration = 10,
    Custom = 11,
}

export enum ButtonType
{
    Create = 1,
    Filter = 2,
    Search = 3,
    Export = 4,
    Navigate = 5,
    Schedule = 6,
    Insert = 7,
    Choose = 8,
    Launch = 9,
    Open = 10,
    Send = 11,
    Invite = 12,
    Close = 13,
    Save = 14,
    Expand = 15,
    Collapse = 16,
    Edit = 17,
    Delete = 18,
    Browse = 19,
    Load = 20,
    Add = 21,
}

@Injectable()
export class AppAnalytics {

    private _logger: KalturaLogger;
    private _enabled = false;
    private _analyticsBaseUrl = '';
    private _lastTrackedEventName = '';

    constructor(private kalturaServerClient: KalturaClient,
                private _appAuthentication: AuthService,
                private _http: HttpClient,
                private router: Router,
                logger: KalturaLogger) {
        this._logger = logger.subLogger('AppAnalytics');
    }

    public init(): void {
        this._logger.info('init app analytics');
        // init analytics base URL
        this._analyticsBaseUrl = analyticsConfig.analyticsServer?.uri?.length ? analyticsConfig.analyticsServer.uri : '';
        if (this._analyticsBaseUrl.length > 0 && this._analyticsBaseUrl.indexOf('http') !== 0) {
            this._analyticsBaseUrl = 'https://' + this._analyticsBaseUrl;
        }
        // enable analytics only if base URL was set correctly
        this._enabled = this._analyticsBaseUrl.length > 0;

        if (this._enabled) {
            this.registerPageLoadEvents();
        }
    }

    private registerPageLoadEvents(): void {
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe((event) => {
                const route = (event as NavigationEnd).urlAfterRedirects;
                switch (true) {
                    case route.startsWith('/audience/engagement'):
                        this.trackEvent(EventType.PageLoad, PageType.Login, 'Analytics_engagement');
                        break;
                    case route.startsWith('/entry/'):
                        this.trackEvent(EventType.PageLoad, PageType.List, 'Analytics_entry');
                        break;
                    case route.startsWith('/audience/content-interactions'):
                        this.trackEvent(EventType.PageLoad, PageType.List, 'Analytics_content_interactions');
                        break;
                    case route.startsWith('/audience/technology'):
                        this.trackEvent(EventType.PageLoad, PageType.List, 'Analytics_technology');
                        break;
                    case route.startsWith('/audience/geo-location'):
                        this.trackEvent(EventType.PageLoad, PageType.List, 'Analytics_geo_location');
                        break;
                    case route.startsWith('/contributors/top-contributors'):
                        this.trackEvent(EventType.PageLoad, PageType.List, 'Analytics_contributors');
                        break;
                    case route.startsWith('/bandwidth/overview'):
                        this.trackEvent(EventType.PageLoad, PageType.Admin, 'Analytics_usage_overview');
                        break;
                    case route.startsWith('/bandwidth/publisher'):
                        this.trackEvent(EventType.PageLoad, PageType.Admin, 'Analytics_publishers_bandwidth_storage');
                        break;
                    case route.startsWith('/bandwidth/end-user'):
                        this.trackEvent(EventType.PageLoad, PageType.Admin, 'Analytics_end_user_storage');
                        break;
                    case route.startsWith('/live'):
                        this.trackEvent(EventType.PageLoad, PageType.Admin, 'Analytics_live');
                        break;
                    case route.startsWith('/entry-live/'):
                        this.trackEvent(EventType.PageLoad, PageType.Admin, 'Analytics_entry_live');
                        break;
                    case route.startsWith('/entry-webcast/'):
                        this.trackEvent(EventType.PageLoad, PageType.Admin, 'Analytics_entry_webcast');
                        break;
                }
            });
    }

    public trackClickEvent(buttonName: string): void {
        let buttonType: ButtonType;
        switch (buttonName) {
            case 'Download_PDF_report':
            case 'Export':
                buttonType = ButtonType.Export;
                break;
            case 'Filter':
            case 'Calendar':
                buttonType = ButtonType.Filter;
                break;
        }
        if (buttonType) {
            this.trackEvent(EventType.ButtonClicked, buttonType, buttonName);
        }
    }

    private trackEvent(eventType: EventType, eventVar1: ButtonType | PageType, eventVar2: string): void {
        if (!this._enabled || eventVar2 === this._lastTrackedEventName) {
            return;
        }
        // prevent reporting the same pageLoad event when time period change causing another routing event
        if (eventType === EventType.PageLoad) {
          this._lastTrackedEventName = eventVar2;
        }
        const ks = this._appAuthentication.ks ? this._appAuthentication.ks : null;
        const pid = this._appAuthentication.pid ? this._appAuthentication.pid :  null;
        // check for entry ID in URL
        const urlParts = this.router.url.split('/');
        const entryIndex = urlParts.indexOf('entry') + 1;
        const entryId =  entryIndex > 0 && urlParts.length >= entryIndex ? urlParts[entryIndex].split('?')[0] : null;
        // build track event url and payload
        let url = `${this._analyticsBaseUrl}/api_v3/index.php?service=analytics&action=trackEvent`;
        let payload = {};
        if (eventType === EventType.PageLoad) {
          payload = {
            eventType,
            pageType: eventVar1,
            pageName: eventVar2
          };
        } else {
          payload = {
            eventType,
            buttonType: eventVar1,
            buttonName: eventVar2
          };
        }
        Object.assign(payload, {
          kalturaApplication: ApplicationType.Analytics,
          kalturaApplicationVer: analyticsConfig.appVersion
        });
        if (pid) {
          Object.assign(payload, { partnerId: pid });
        }
        if (entryId) {
          Object.assign(payload, { entryId });
        }
        if (ks) {
          Object.assign(payload, { ks });
        }
        // send tracking event
        this._http.post(url, payload).subscribe(); // no need to handle response
    }
}