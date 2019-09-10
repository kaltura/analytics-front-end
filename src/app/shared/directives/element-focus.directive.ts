import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appElementFocus]'
})
export class ElementFocusDirective {
  @HostListener('focus')
  setInputFocus(): void {
    this._elementRef.nativeElement.classList.add('has-focus');
  }
  
  @HostListener('blur')
  setInputFocusOut(): void {
    this._elementRef.nativeElement.classList.remove('has-focus');
  }
  
  public get isFocused(): boolean {
    return this._elementRef.nativeElement.classList.contains('has-focus');
  }
  
  constructor(private _elementRef: ElementRef) {
  }
  
  public focus(): void {
    this._elementRef.nativeElement.focus();
  }
  
  public blur(): void {
    this._elementRef.nativeElement.blur();
  }
}
