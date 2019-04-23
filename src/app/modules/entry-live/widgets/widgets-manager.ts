import { WidgetBase } from './widget-base';
import { Observable } from 'rxjs';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';

export interface WidgetsActivationArgs {
  entryId: string;
}

export class WidgetsManager {
  protected _widgets: WidgetBase<any>[] = [];
  
  constructor(protected _logger: KalturaLogger) {
    this._logger = _logger.subLogger('WidgetsManager');
  }

  public register(widgets: WidgetBase<any>[], widgetsArgs: WidgetsActivationArgs): void {
    this._widgets = widgets;
  
    const activationTasks = this._widgets.map(widget => widget.activate(widgetsArgs));

    Observable.forkJoin(...activationTasks)
      .subscribe(results => {
        console.warn(results);
      });
  }
}
