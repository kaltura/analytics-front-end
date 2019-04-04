import { AfterViewInit, Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { Table } from 'primeng/table';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { analyticsConfig } from 'configuration/analytics-config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { PageScrollConfig, PageScrollInstance, PageScrollService } from 'ngx-page-scroll';
import { merge as ObservableMerge, Observable } from 'rxjs';

@Directive({
  selector: '[appScrollTopOnPaging]',
  providers: [PageScrollService]
})
export class ScrollTopOnPagingDirective implements OnInit, AfterViewInit, OnDestroy {
  @Input() scrollOffset = 0;
  
  @Input() customPaginationEvent: Observable<void>;
  
  private _tableElement: HTMLElement;
  
  constructor(private _el: ElementRef<HTMLElement>,
              private _table: Table,
              private _pageScrollService: PageScrollService,
              private _frameEventManager: FrameEventManagerService) {
  }
  
  ngOnInit() {
    this._hookToPaging();
  }
  
  ngAfterViewInit(): void {
    this._tableElement = this._el.nativeElement;
  }
  
  ngOnDestroy(): void {
  
  }
  
  private _hookToPaging(): void {
    if (this._table instanceof Table) {
      const sources = this.customPaginationEvent ? [this._table.onPage, this.customPaginationEvent] : [this._table.onPage];
      ObservableMerge(...sources)
        .pipe(cancelOnDestroy(this))
        .subscribe(() => this._scrollTop2());
    }
  }
  
  private _scrollTop2(): void {
    const currentScrollTop = window.scrollY;
    const currentTableHeight = this._tableElement.getBoundingClientRect().height;
    setTimeout(() => {
      const deltaHeight = currentTableHeight - this._tableElement.getBoundingClientRect().height;
      if (deltaHeight > 0) {
        window.scrollTo(0, currentScrollTop - deltaHeight);
      }
    }, 0);
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
