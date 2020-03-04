import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CategoryGetAction,
  KalturaCategory,
  KalturaClient,
  KalturaDetachedResponseProfile,
  KalturaReportInterval,
  KalturaReportType,
  KalturaResponseProfileType
} from 'kaltura-ngx-client';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { BrowserService, ErrorsManagerService, NavigationDrillDownService } from 'shared/services';
import { ViewConfig, viewsConfig } from "configuration/view-config";
import { DateChangeEvent, DateRanges } from "shared/components/date-filter/date-filter.service";
import { analyticsConfig } from "configuration/analytics-config";
import { DateFilterUtils } from "shared/components/date-filter/date-filter-utils";
import { ExportItem } from "shared/components/export-csv/export-config-base.service";
import { RefineFilter } from "shared/components/filter/filter.component";
import { CategoryExportConfig } from "./category-export.config";
import { FrameEventManagerService, FrameEvents } from "shared/modules/frame-event-manager/frame-event-manager.service";
import { CategoryTopContentComponent } from "./views/category-top-content";
import { TopCountriesComponent } from "shared/components/top-countries-report/top-countries.component";

@Component({
  selector: 'app-category',
  templateUrl: './category-view.component.html',
  styleUrls: ['./category-view.component.scss'],
  providers: [CategoryExportConfig]
})
export class CategoryViewComponent implements OnInit, OnDestroy {
  
  @ViewChild('topVideos', {static: false}) set topVideos(comp: CategoryTopContentComponent) {
    setTimeout(() => { // use timeout to prevent check after init error
      this._categoryTopContentComponent = comp;
    }, 0);
  }
  @ViewChild('topCountries', {static: false}) set topCountries(comp: TopCountriesComponent) {
    setTimeout(() => { // use timeout to prevent check after init error
      this._topCountriesComponent = comp;
    }, 0);
  }
  public _selectedRefineFilters: RefineFilter = null;
  public _viewConfig: ViewConfig = { ...viewsConfig.category };
  public _dateRange = DateRanges.Last30D;
  public _timeUnit = KalturaReportInterval.days;
  public _creationDate = '';
  public _updateDate = '';
  public _dateFilter: DateChangeEvent = null;
  public _exportConfig: ExportItem[] = [];
  public _refineFilter: RefineFilter = null;
  public _refineFilterOpened = false;
  public _miniViewsCount = [
    this._viewConfig.miniTopVideos,
    this._viewConfig.miniTopViewers,
    this._viewConfig.insights
  ].filter(Boolean).length;
  
  public _loadingCategory = false;
  public _categoryLoaded = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _category: KalturaCategory;
  public _categoryId = '';
  public _parentCategoryName = '';
  public _categoryTopContentComponent: CategoryTopContentComponent;
  public _topCountriesComponent: TopCountriesComponent;

  constructor(private _router: Router,
              private _route: ActivatedRoute,
              private _kalturaClient: KalturaClient,
              private _browserService: BrowserService,
              private _errorsManager: ErrorsManagerService,
              private _exportConfigService: CategoryExportConfig,
              private _frameEventManager: FrameEventManagerService,
              private _navigationDrillDownService: NavigationDrillDownService) {
  }

  ngOnInit() {
    this._exportConfig = this._exportConfigService.getConfig(this._viewConfig);
    this._route.params
      .pipe(cancelOnDestroy(this))
      .subscribe(params => {
        this._categoryId = params['id'];
        if (this._categoryId) {
          this._loadCategoryDetails();
        }
      });
  }

  ngOnDestroy() {
  }
  
  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
  }
  
  public _onRefineFilterChange(event: RefineFilter): void {
    this._refineFilter = event;
  }

  private _loadCategoryDetails(parentCategory = false): void {
    this._loadingCategory = true;
    this._categoryLoaded = false;
    this._blockerMessage = null;

    const request = new CategoryGetAction({ id: (parentCategory && this._category.parentId) ? this._category.parentId : parseInt(this._categoryId) })
        .setRequestOptions({
          responseProfile: new KalturaDetachedResponseProfile({
            type: KalturaResponseProfileType.includeFields,
            fields: parentCategory ? 'id,name' : 'id,name,fullName,parentId,createdAt,updatedAt,directSubCategoriesCount,entriesCount'
          })
        });

    this._kalturaClient
      .request(request)
      .pipe(cancelOnDestroy(this))
      .subscribe(
        (category: KalturaCategory) => {
          this._categoryLoaded = true;
          if (parentCategory) {
            this._parentCategoryName = category.name;
            this._loadingCategory = false;
            this._categoryLoaded = true;
            this._viewConfig.refineFilter.categories = category.directSubCategoriesCount ? {} : null; // hide sub-categories filter if the current category has no sub categories
          } else {
            this._category = category;
            this._viewConfig.refineFilter.categories = category.directSubCategoriesCount ? {} : null; // hide sub-categories filter if the current category has no sub categories
            const dateFormat = analyticsConfig.dateFormat === 'month-day-year' ? 'MM/DD/YYYY' : 'DD/MM/YYYY';
            this._creationDate = DateFilterUtils.getMomentDate(category.createdAt).format(dateFormat);
            this._updateDate = DateFilterUtils.getMomentDate(category.updatedAt).format(dateFormat);
            if (category.parentId) {
              this._loadCategoryDetails(true);
            } else {
              this._loadingCategory = false;
            }
          }
        },
        error => {
          this._loadingCategory = false;
          this._categoryLoaded = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._loadCategoryDetails();
            }
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }
  
  public _onGeoDrillDown(event: { reportType: KalturaReportType, drillDown: string[] }): void {
    let update: Partial<ExportItem> = { reportType: event.reportType, additionalFilters: {} };
    
    if (event.drillDown && event.drillDown.length > 0) {
      update.additionalFilters.countryIn = event.drillDown[0];
    }
    
    if (event.drillDown && event.drillDown.length > 1) {
      update.additionalFilters.regionIn = event.drillDown[1];
    }
    
    this._exportConfig = CategoryExportConfig.updateConfig(this._exportConfigService.getConfig(this._viewConfig), 'geo', update);
  }
  

  public _navigateToParent(parentId: number): void {
    this._router.navigate(['category/' + parentId], {queryParams: this._route.snapshot.queryParams});
    if (analyticsConfig.isHosted) {
      const params = this._browserService.getCurrentQueryParams('string', { id: parentId.toString() });
      this._frameEventManager.publish(FrameEvents.NavigateTo, `/analytics/category?${params}`);
    }
  }

  public _back(): void {
    this._navigationDrillDownService.navigateBack('audience/engagement', true);
  }
  
}
