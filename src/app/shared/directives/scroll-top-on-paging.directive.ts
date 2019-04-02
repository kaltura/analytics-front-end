import { AfterViewInit, Directive, ElementRef, Input, OnDestroy } from '@angular/core';
import { Table } from 'primeng/table';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { analyticsConfig } from 'configuration/analytics-config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { PageScrollConfig, PageScrollInstance, PageScrollService } from 'ngx-page-scroll';

@Directive({ selector: '[appScrollTopOnPaging]' })
export class ScrollTopOnPagingDirective implements AfterViewInit, OnDestroy {
  @Input() scrollOffset = 0;
  
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
        const rect = targetEl.getBoundingClientRect();
        const top = rect.top + window.pageYOffset;
        
        this._frameEventManager.publish(FrameEvents.ScrollTo, top - this.scrollOffset);
      }
    } else {
      PageScrollConfig.defaultDuration = 0;
      const pageScrollInstance = PageScrollInstance.simpleInstance(document, this._tableElement);
      this._pageScrollService.start(pageScrollInstance);
    }
  }
}
