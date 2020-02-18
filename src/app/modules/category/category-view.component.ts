import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryGetAction, KalturaCategory, KalturaClient, KalturaDetachedResponseProfile, KalturaReportInterval, KalturaResponseProfileType } from 'kaltura-ngx-client';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, NavigationDrillDownService } from 'shared/services';
import { ViewConfig, viewsConfig } from "configuration/view-config";
import { DateChangeEvent, DateRanges } from "shared/components/date-filter/date-filter.service";
import { analyticsConfig } from "configuration/analytics-config";
import { DateFilterUtils } from "shared/components/date-filter/date-filter-utils";
import {ExportItem} from "shared/components/export-csv/export-config-base.service";
import {RefineFilter} from "shared/components/filter/filter.component";
import {CategoryExportConfig} from "./category-export.config";

@Component({
  selector: 'app-category',
  templateUrl: './category-view.component.html',
  styleUrls: ['./category-view.component.scss'],
  providers: [
    CategoryExportConfig
  ]
})
export class CategoryViewComponent implements OnInit, OnDestroy {
  
  public _viewConfig: ViewConfig = { ...viewsConfig.category };
  public _dateRange = DateRanges.Last30D;
  public _timeUnit = KalturaReportInterval.days;
  public _creationDate = '';
  public _updateDate = '';
  public _dateFilter: DateChangeEvent = null;
  public _exportConfig: ExportItem[] = [];
  public _refineFilter: RefineFilter = null;
  public _refineFilterOpened = false;
  
  public _loadingCategory = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _category: KalturaCategory;
  public _categoryId = '';

  constructor(private _router: Router,
              private _route: ActivatedRoute,
              private _kalturaClient: KalturaClient,
              private _errorsManager: ErrorsManagerService,
              private _exportConfigService: CategoryExportConfig,
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

  private _loadCategoryDetails(): void {
    this._loadingCategory = true;
    this._blockerMessage = null;

    const request = new CategoryGetAction({ id: parseInt(this._categoryId) })
        .setRequestOptions({
          responseProfile: new KalturaDetachedResponseProfile({
            type: KalturaResponseProfileType.includeFields,
            fields: 'id,name,parentId,createdAt,updatedAt,directSubCategoriesCount,entriesCount'
          })
        });

    this._kalturaClient
      .request(request)
      .pipe(cancelOnDestroy(this))
      .subscribe(
        (category: KalturaCategory) => {
          this._category = category;
          const dateFormat = analyticsConfig.dateFormat === 'month-day-year' ? 'MM/DD/YYYY' : 'DD/MM/YYYY';
          this._creationDate = DateFilterUtils.getMomentDate(category.createdAt).format(dateFormat);
          this._updateDate = DateFilterUtils.getMomentDate(category.updatedAt).format(dateFormat);
          this._loadingCategory = false;
        },
        error => {
          this._loadingCategory = false;
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

  public _navigateToParent(parentId: number): void {
    this._router.navigate(['category/' + parentId], {queryParams: this._route.snapshot.queryParams});
  }

  public _back(): void {
    this._navigationDrillDownService.navigateBack('audience/engagement', true);
  }
  
}
