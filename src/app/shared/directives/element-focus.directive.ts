import { Directive, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appElementFocus]'
})
export class ElementFocusDirective {
  
  constructor(private _elementRef: ElementRef,
              private _renderer: Renderer2) {
  }
  
  public setFocus(): void {
    this._renderer.setAttribute(this._elementRef.nativeElement, 'tabindex', '0');
    this._elementRef.nativeElement.focus();
  }
  
  public removeFocus(): void {
    this._renderer.setAttribute(this._elementRef.nativeElement, 'tabindex', '-1');
    this._elementRef.nativeElement.blur();
  }
}
