import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {
  CuePointListAction,
  KalturaAnnotationFilter,
  KalturaClient,
  KalturaCuePointType,
  KalturaCuePointListResponse,
  KalturaFilterPager,
  KalturaNullableBoolean,
  KalturaAnnotation,
  KalturaMultiResponse,
  KalturaAPIException,
  KalturaThumbCuePointFilter,
  KalturaCodeCuePointFilter,
  KalturaCodeCuePoint,
  KalturaDetachedResponseProfile,
  KalturaMetadataFilter,
  KalturaMetadataObjectType,
  KalturaResponseProfileMapping,
  KalturaResponseProfileType,
  KalturaReportType,
  KalturaReportInterval,
  KalturaEndUserReportInputFilter,
  KalturaObjectBaseFactory, KalturaReportTotal, KalturaReportTable,
} from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import {AuthService, BrowserService, ErrorsManagerService, Report, ReportConfig, ReportService} from 'shared/services';
import { TranslateService } from '@ngx-translate/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { analyticsConfig } from "configuration/analytics-config";
import {cancelOnDestroy} from "@kaltura-ng/kaltura-common";
import {OverlayComponent} from "shared/components/overlay/overlay.component";
import { MiniEngagementToolsConfig } from './mini-engagement-tools.config';
import { ReactionsBreakdownConfig } from './reactions-breakdown-overlay/reactions-breakdown.config';
import {WebcastBaseReportComponent} from "../webcast-base-report/webcast-base-report.component";
import {ReportDataConfig} from "shared/services/storage-data-base.config";
import {reportTypeMap} from "shared/utils/report-type-map";
import {map, switchMap} from "rxjs/operators";
import {of as ObservableOf} from "rxjs";
import {Tab} from "shared/components/report-tabs/report-tabs.component";
import {CompareService} from "shared/services/compare.service";

@Component({
  selector: 'app-webcast-mini-engagement-tools',
  templateUrl: './mini-engagement-tools.component.html',
  styleUrls: ['./mini-engagement-tools.component.scss'],
  providers: [
    KalturaLogger.createLogger('WebcastMiniEngagementToolsComponent'),
    MiniEngagementToolsConfig,
    ReactionsBreakdownConfig,
    ReportService
  ]
})

export class WebcastMiniEngagementToolsComponent extends WebcastBaseReportComponent implements OnDestroy, OnInit {

  private _dataConfig: ReportDataConfig;
  private _breakdownConfig: ReportDataConfig;
  protected _componentId = 'webcast-mini-engagement-tools';

  @Input() entryIdIn = '';
  @ViewChild('overlay') _overlay: OverlayComponent;

  public _isBusy: boolean;
  public _loadingReport: boolean;
  public _blockerMessage: AreaBlockerMessage = null;

  private _order = '-date_id';
  public _tabsData: Tab[] = [];
  private _reportType = reportTypeMap(KalturaReportType.engagementToolsWebcast);
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _pager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }

  public _slides = 0;
  public _polls = 0;
  public _announcements = 0;
  public _answer_on_air = 0;

  public _reactionsBreakdown = {
    Clap: 0,
    Smile: 0,
    Wow: 0,
    Heart: 0,
    Think: 0
  }

  constructor(private _translate: TranslateService,
              private _kalturaClient: KalturaClient,
              private _browserService: BrowserService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _authService: AuthService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: MiniEngagementToolsConfig,
              private _breakdownConfigService: ReactionsBreakdownConfig,

              private _logger: KalturaLogger) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
    this._breakdownConfig = _breakdownConfigService.getConfig();
  }

  ngOnInit(): void {
    this._isBusy = true;
    this._kalturaClient
      .multiRequest([
        this.getEntryCuePoints(),
        this.getSlides(),
        this.getPolls()
      ])
      .pipe(cancelOnDestroy(this))
      .subscribe(
        (responses: KalturaMultiResponse) => {
          if (responses.hasErrors()) {
            const err: KalturaAPIException = responses.getFirstError();
            throw err;
          }
          this._parseCuePointsResponse(responses[0].result as KalturaCuePointListResponse);
          this._slides = (responses[1].result as KalturaCuePointListResponse).totalCount;
          this._parsePolls(responses[2].result as KalturaCuePointListResponse);
          this._isBusy = false;
        },
        error => {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            }
          };
          this._isBusy = false;
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }

  ngOnDestroy(): void {
  }

  private getEntryCuePoints(): CuePointListAction {

    const filter: KalturaAnnotationFilter = new KalturaAnnotationFilter({
      cuePointTypeEqual: KalturaCuePointType.annotation,
      tagsLike: 'qna',
      entryIdEqual: this.entryIdIn,
      orderBy: '+createdAt',
      isPublicEqual: KalturaNullableBoolean.trueValue
    });

    const pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 500, pageIndex: 1});

    return new CuePointListAction({ filter, pager })
      .setRequestOptions(
        {
          responseProfile: this.getResponseProfile()
        }
      )
  }

  private getResponseProfile(): KalturaDetachedResponseProfile {
    //metadata filter
    const metadataFilter = new KalturaMetadataFilter({
      metadataObjectTypeEqual: KalturaMetadataObjectType.annotation
    });
    //metadata filter mapping
    const metadataFilterMapping = new KalturaResponseProfileMapping({
      filterProperty: 'objectIdEqual',
      parentProperty: 'id'
    });
    //detached metadata response profile
    const metadataResponseProfile = new KalturaDetachedResponseProfile({
      name: 'analytics_qna_drp',
      type: KalturaResponseProfileType.includeFields,
      fields: 'id,xml',
      filter: metadataFilter,
      mappings: [metadataFilterMapping]
    });
    //cue point response profile
    const cuepointResponseProfile = new KalturaDetachedResponseProfile({
      name: 'analytics_webcast_cp',
      type: KalturaResponseProfileType.includeFields,
      fields: 'id,createdAt,updatedAt,text,userId',
      relatedProfiles: [metadataResponseProfile]
    });
    return cuepointResponseProfile;
  }

  private getSlides(): CuePointListAction {
    const filter: KalturaThumbCuePointFilter = new KalturaThumbCuePointFilter({
      cuePointTypeEqual: KalturaCuePointType.thumb,
      entryIdEqual: this.entryIdIn
    });
    const pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 500, pageIndex: 1});
    return new CuePointListAction({ filter, pager });
  }

  private getPolls(): CuePointListAction {
    const filter: KalturaCodeCuePointFilter = new KalturaCodeCuePointFilter({
      cuePointTypeEqual: KalturaCuePointType.code,
      tagsLike: 'poll-data',
      entryIdEqual: this.entryIdIn
    });
    const pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 500, pageIndex: 1});
    return new CuePointListAction({ filter, pager });
  }

  private _parseCuePointsResponse(data: KalturaCuePointListResponse): void {
    if (data.objects) {
      const parser = new DOMParser();
      data.objects.forEach((cuePoint: KalturaAnnotation) => {
        if (cuePoint.relatedObjects && cuePoint.relatedObjects.analytics_qna_drp) {
          if (cuePoint.relatedObjects.analytics_qna_drp['objects'] && cuePoint.relatedObjects.analytics_qna_drp['objects'][0] && cuePoint.relatedObjects.analytics_qna_drp['objects'][0]['xml'] ){
            const xml = cuePoint.relatedObjects.analytics_qna_drp['objects'][0]['xml'];
            const xmlDoc = parser.parseFromString(xml,"text/xml");
            const type = xmlDoc.getElementsByTagName("Type")[0].childNodes[0].nodeValue;
            if (type === "Announcement") {
              this._announcements++;
            }
            if (type === "AnswerOnAir") {
              this._answer_on_air++;
            }
          }
        }
      });
    }
  }

  private _parsePolls(data: KalturaCuePointListResponse): void {
    let pollsCount = 0;
    if (data.objects) {
      data.objects.forEach((cuePoint: KalturaCodeCuePoint) => {
        if (cuePoint.partnerData) {
          const partnerData = JSON.parse(cuePoint.partnerData);
          if (partnerData.text && (partnerData.text.question || partnerData.text.answers)) {
            pollsCount++;
          }
        }
      })
    }
    this._polls = pollsCount;
  }

  /* ---------------- reports loading and handling starts here ----------------------- */

  protected _loadReport(sections = this._dataConfig): void {
    this._loadingReport = true;
    this._blockerMessage = null;
    this._filter.entryIdIn = this.entryIdIn;
    this.resetReactionsBreakdown();
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order };
    this._reportService.getReport(reportConfig, sections, false)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        this._compareFilter.entryIdIn = this.entryIdIn;
        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, order: this._order };

        return this._reportService.getReport(compareReportConfig, sections, false)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {

          if (report.totals) {
            this._handleTotals(report.totals); // handle totals
          }

          if (compare) {
            this._handleCompare(report, compare);
          }
          this._loadingReport = false;
        },
        error => {
          this._loadingReport = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._loadReport();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }

  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }

  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._pager.pageIndex = 1;
    if (this._dateFilter.compare.active) {
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDate = compare.startDate;
      this._compareFilter.toDate = compare.endDate;
    } else {
      this._compareFilter = null;
    }
  }

  private _handleCompare(current: Report, compare: Report): void {
    const currentPeriod = { from: this._filter.fromDate, to: this._filter.toDate };
    const comparePeriod = { from: this._compareFilter.fromDate, to: this._compareFilter.toDate };

    if (current.totals && compare.totals) {
      this._tabsData = this._compareService.compareTotalsData(
        currentPeriod,
        comparePeriod,
        current.totals,
        compare.totals,
        this._dataConfig.totals
      );
    }
  }

  private _handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals);
    if (this._tabsData.length && this._tabsData[0].value && parseInt(this._tabsData[0].value) > 0) {
      this.loadReactionsBreakdown(parseInt(this._tabsData[0].value));
    }
  }

  private loadReactionsBreakdown(totals: number): void {
    const reportConfig: ReportConfig = { reportType: reportTypeMap(KalturaReportType.reactionsBreakdownWebcast), filter: this._filter, order: this._order };
    this._reportService.getReport(reportConfig, this._breakdownConfig, false)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        this._compareFilter.entryIdIn = this.entryIdIn;
        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, order: this._order };

        return this._reportService.getReport(compareReportConfig, this._breakdownConfig, false)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          if (report.table) {
            this.handleReactionsTable(report.table, totals);
          }

          if (compare) {
            this._handleCompare(report, compare);
          }
        },
        error => {
          console.log(`Error loading reactions breakdown: ${error}`);
        });
  }

  private handleReactionsTable(table: KalturaReportTable, totals: number): void {
    const { tableData } = this._reportService.parseTableData(table, this._breakdownConfig.table);
    tableData.forEach(reactionData => {
      const value = parseInt(reactionData.count_reaction_clicked) / totals * 100;
      const percents = Math.round(value * 100) / 100;
      this._reactionsBreakdown[reactionData.reaction] = percents;
    });
  }

  private resetReactionsBreakdown(): void {
    this._reactionsBreakdown = {
      Clap: 0,
      Smile: 0,
      Wow: 0,
      Heart: 0,
      Think: 0
    }
  }

  public _showReactionsBreakdown(event: any): void {
    setTimeout(() => {
      if (this._overlay && event) {
        this._overlay.show(event);
      }
    }, 200);
  }

  public _hideReactionsBreakdown(): void {
    if (this._overlay) {
      this._overlay.hide();
    }
  }

  /* ---------------- reports loading and handling ends here ----------------------- */

  public export(): void {
    this._browserService.exportToCsv(`${this._authService.pid}-Report_export-${this.entryIdIn.split(analyticsConfig.valueSeparator)[0]}.csv`,[
      ["# ------------------------------------"],
      ["Report: Engagement Tools"],
      ["Slides", "Polls", "Announcements", "Answer On Air"],
      [this._slides, this._polls, this._announcements, this._answer_on_air ],
      ["# ------------------------------------"],
    ]);
  }

}
