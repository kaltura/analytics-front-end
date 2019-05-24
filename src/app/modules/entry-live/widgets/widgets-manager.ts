import { WidgetBase } from './widget-base';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { Injectable } from '@angular/core';

export interface WidgetsActivationArgs {
  entryId: string;
}

@Injectable()
export class WidgetsManager {
  protected _widgets: WidgetBase<any>[] = [];
  
  constructor(protected _logger: KalturaLogger) {
    this._logger = _logger.subLogger('WidgetsManager');
  }
  
  public register(widgets: WidgetBase<any>[], widgetsArgs: WidgetsActivationArgs): void {
    this._widgets = widgets;
    
    this._widgets.map(widget => widget.activate(widgetsArgs));
  }
  
  public deactivateAll(): void {
    this._widgets.forEach(widget => widget.deactivate());
  }
}
