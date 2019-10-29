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
  
  /*
   Silent widgets are widgets that are activated, but don't start polling upon activation
   */
  public register(widgets: WidgetBase<any>[], widgetsArgs: WidgetsActivationArgs, silentWidgets: WidgetBase<any>[] = []): void {
    this._widgets = [...widgets, ...silentWidgets];
  
    widgets.map(widget => widget.activate(widgetsArgs));
    silentWidgets.map(widget => widget.activate(widgetsArgs, true));
  }
  
  public deactivateAll(): void {
    this._widgets.forEach(widget => widget.deactivate());
  }
  
  public restartAll(): void {
    this._widgets.forEach(widget => widget.restartPolling());
  }
}
