import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';
import { analyticsConfig } from 'configuration/analytics-config';
import { TranslateService } from '@ngx-translate/core';

@Directive({ selector: '[appAreaBlockerTimeout]' })
export class AreaBlockerTimeoutDirective {
  @Input() set appAreaBlockerTimeout(value: boolean) {
    if (value) {
      this._startTimeout();
    } else {
      this._cancelTimeout();
    }
  }
  
  private _element: HTMLElement;
  private _timeout: number;
  
  constructor(private _el: ElementRef,
              private _renderer: Renderer2,
              private _translate: TranslateService) {
    this._element = _el.nativeElement as HTMLElement;
  }
  
  private _startTimeout(): void {
    this._timeout = setTimeout(() => this._renderWarning(), analyticsConfig.kalturaServer.warnRequestTimeout);
  }
  
  private _cancelTimeout(): void {
    clearTimeout(this._timeout);
  }
  
  private _renderWarning(): void {
    const container = this._element.querySelector('.spinner-container');
    
    if (container) {
      const warning = this._renderer.createElement('span');
      this._renderer.addClass(warning, 'area-blocker-warning');
      this._renderer.setProperty(warning, 'innerHTML', this._translate.instant('app.errors.warningRequestTimeout'));
      this._renderer.appendChild(container, warning);
    }
  }
}
