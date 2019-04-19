import { WidgetBase } from './widget-base';
import { Observable } from 'rxjs';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';

export class WidgetsManager {
  protected _widgets: WidgetBase<any>[] = [];
  
  constructor(protected _logger: KalturaLogger) {
    this._logger = _logger.subLogger('WidgetsManager');
  }

  public register(widgets: WidgetBase<any>[]): void {
    this._widgets = widgets;
  
    const activationTasks = this._widgets.map(widget => widget.activate());

    Observable.forkJoin(...activationTasks)
      .subscribe(results => {
        console.warn(results);
      });
  }
}
