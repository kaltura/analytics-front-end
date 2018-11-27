import { Component, Input } from '@angular/core';
import { animate, AnimationEvent, state, style, transition, trigger } from '@angular/animations';
import { DomHandler, OverlayPanel } from 'primeng/primeng';

@Component({
  selector: 'k-overlayPanel',
  template: `
    <div [ngClass]="'ui-overlaypanel ui-widget ui-widget-content ui-corner-all ui-shadow'" [ngStyle]="style" [class]="styleClass" (click)="onPanelClick($event)"
         [@animation]="'visible'" (@animation.start)="onAnimationStart($event)" *ngIf="visible">
      <div class="ui-overlaypanel-content">
        <ng-content></ng-content>
      </div>
      <a href="#" *ngIf="showCloseIcon" class="ui-overlaypanel-close ui-state-default" (click)="onCloseClick($event)">
        <span class="ui-overlaypanel-close-icon pi pi-times"></span>
      </a>
    </div>
  `,
  animations: [
    trigger('animation', [
      state('void', style({
        transform: 'translateY(5%)',
        opacity: 0
      })),
      state('visible', style({
        transform: 'translateY(0)',
        opacity: 1
      })),
      transition('void => visible', animate('225ms ease-out')),
      transition('visible => void', animate('195ms ease-in'))
    ])
  ],
  providers: [DomHandler]
})
export class OverlayComponent extends OverlayPanel {
  @Input() offset = 10;
  @Input() openDirection: 'up' | 'down' = 'up';
  
  private _absolutePosition(element: any, target: any): void {
    let elementDimensions = element.offsetParent
      ? { width: element.offsetWidth, height: element.offsetHeight }
      : this.domHandler.getHiddenElementDimensions(element);
    let elementOuterHeight = elementDimensions.height;
    let elementOuterWidth = elementDimensions.width;
    let targetOuterHeight = target.offsetHeight;
    let targetOuterWidth = target.offsetWidth;
    let targetOffset = target.getBoundingClientRect();
    let windowScrollTop = this.domHandler.getWindowScrollTop();
    let windowScrollLeft = this.domHandler.getWindowScrollLeft();
    let viewport = this.domHandler.getViewport();
    let top, left;
    
    if (this.openDirection === 'up') {
      if (targetOffset.top - elementOuterHeight - this.offset < 0) { // open down
        top = targetOuterHeight + targetOffset.top + windowScrollTop + this.offset;
      } else { // open up
        top = targetOffset.top + windowScrollTop - elementOuterHeight - this.offset;
        if (top < 0) {
          top = windowScrollTop - this.offset;
        }
      }
    } else {
      if (targetOffset.top + targetOuterHeight + elementOuterHeight > viewport.height) { // open up
        top = targetOffset.top + windowScrollTop - elementOuterHeight - this.offset;
        if (top < 0) {
          top = windowScrollTop - this.offset;
        }
      } else { // open down
        top = targetOuterHeight + targetOffset.top + windowScrollTop + this.offset;
      }
    }
    
    if (targetOffset.left + targetOuterWidth + elementOuterWidth > viewport.width) {
      left = targetOffset.left + windowScrollLeft + targetOuterWidth - elementOuterWidth;
    } else {
      left = targetOffset.left + windowScrollLeft;
    }
    
    element.style.top = top + 'px';
    element.style.left = left + 'px';
  }
  
  onAnimationStart(event: AnimationEvent) {
    switch (event.toState) {
      case 'visible':
        this.container = event.element;
        this.onShow.emit(null);
        this.appendContainer();
        if (this.autoZIndex) {
          this.container.style.zIndex = String(this.baseZIndex + (++DomHandler.zindex));
        }
        this._absolutePosition(this.container, this.target);
        this.bindDocumentClickListener();
        this.bindDocumentResizeListener();
        break;
      
      case 'void':
        this.onOverlayHide();
        break;
    }
  }
}
