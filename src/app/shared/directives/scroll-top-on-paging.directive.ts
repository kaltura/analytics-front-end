import { AfterViewInit, Directive, ElementRef, OnDestroy } from '@angular/core';
import { Table } from 'primeng/table';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { analyticsConfig } from 'configuration/analytics-config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { PageScrollConfig, PageScrollInstance, PageScrollService } from 'ngx-page-scroll';

@Directive({ selector: '[appScrollTopOnPaging]' })
export class ScrollTopOnPagingDirective implements AfterViewInit, OnDestroy {
  private _tableElement: HTMLElement;

  constructor(private _el: ElementRef<HTMLElement>,
              private _table: Table,
              private _pageScrollService: PageScrollService,
              private _frameEventManager: FrameEventManagerService) {
    this._hookToPaging();
  }
  
  ngAfterViewInit(): void {
    this._tableElement = this._el.nativeElement;
  }
  
  ngOnDestroy(): void {
  
  }
  
  private _hookToPaging(): void {
    if (this._table instanceof Table) {
      this._table.onPage
        .pipe(cancelOnDestroy(this))
        .subscribe(() => this._scrollTop());
    }
  }
  
  private _scrollTop(): void {
    if (analyticsConfig.isHosted) {
      const targetEl = this._tableElement.getElementsByClassName('ui-table')[0] as HTMLElement;
      
      if (targetEl) {
        const menuOffset = 50; // contributors page doesn't have sub menu, subtract menu offset for correct scroll
        this._frameEventManager.publish(FrameEvents.ScrollTo, targetEl.offsetTop - menuOffset);
      }
    } else {
      PageScrollConfig.defaultDuration = 0;
      const pageScrollInstance = PageScrollInstance.simpleInstance(document, this._tableElement);
      this._pageScrollService.start(pageScrollInstance);
    }
  }
}
