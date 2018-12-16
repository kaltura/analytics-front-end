import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';

@Directive({ selector: '[appMiddleEllipsis]' })
export class MiddleEllipsisDirective implements AfterViewInit {
  @Input() appMiddleEllipsis: string;
  @Input() fontSettings = 'bold 15px Lato';
  
  private _element: HTMLElement;
  
  constructor(private _el: ElementRef) {
    this._element = _el.nativeElement as HTMLElement;
  }
  
  ngAfterViewInit() {
    const computedStyle = getComputedStyle(this._element.parentElement);
    const text = this.appMiddleEllipsis;
    const padding = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    const width = this._element.parentElement.offsetWidth - padding;
    const textWidth = this._getTextWidth(text);
  
    let result = text;

    if (textWidth >= width) {
      const avgCharWidth = textWidth / text.length;
      const visibleCharsAmount = Math.floor(width / avgCharWidth) - 3; // minus 3 dots chars in the middle
      const visibleHalf = Math.floor(visibleCharsAmount / 2);
      result = `${text.substr(0, visibleHalf)}...${text.substr(text.length - visibleHalf)}`;
    }
    
    this._element.innerText = result;
  }
  
  /**
   * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
   *
   * @param {String} text The text to be rendered.
   * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
   *
   * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
   */
  private _getTextWidth(text: string, font: string = this.fontSettings): number {
    // re-use canvas object for better performance
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    return context.measureText(text).width;
  }
}
