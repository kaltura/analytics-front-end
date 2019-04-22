import { AfterViewInit, Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Observable } from 'rxjs';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

@Directive({
  selector: '[appEvenTableHeight]'
})
export class EvenTableHeightDirective implements OnInit, AfterViewInit, OnDestroy {
  @Input() updateListener: Observable<void>;
  
  private _element: HTMLElement;
  
  constructor(private _el: ElementRef,
              private _renderer: Renderer2) {
    this._element = _el.nativeElement as HTMLElement;
  }
  
  ngOnInit() {
    if (this.updateListener) {
      this.updateListener
        .pipe(cancelOnDestroy(this))
        .subscribe(() => this._setEvenHeight());
    }
  }
  
  ngAfterViewInit(): void {
    this._setEvenHeight();
  }
  
  ngOnDestroy() {
  
  }
  
  private _setEvenHeight(): void {
    setTimeout(() => {
      if (this._element instanceof HTMLElement) {
        const tableWrappers = Array.from(this._element.getElementsByClassName('kDividerWrapper'));
        const table = Array.from(this._element.getElementsByClassName('ui-table'));
        if (table.length > 1 && tableWrappers.length > 1) { // if there're several tables on the page update their height by max of all tables
          const maxHeight = Math.max(...table.map(element => element.getBoundingClientRect().height));
      
          if (maxHeight) {
            tableWrappers.forEach(element => {
              this._renderer.setStyle(element, 'height', `${maxHeight}px`);
            });
          }
        } else { // else set wrapper's height to auto
          tableWrappers.forEach(element => {
            this._renderer.setStyle(element, 'height', 'auto');
          });
        }
      }
    }, 0);
  }
}
