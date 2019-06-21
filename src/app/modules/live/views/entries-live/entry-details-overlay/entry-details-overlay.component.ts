import { Component, Input, OnDestroy } from '@angular/core';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { timer as ObservableTimer, Unsubscribable } from 'rxjs';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { filter } from 'rxjs/operators';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import * as moment from 'moment';

@Component({
  selector: 'app-entry-details-overlay',
  templateUrl: './entry-details-overlay.component.html',
  styleUrls: ['./entry-details-overlay.component.scss'],
})
export class EntryDetailsOverlayComponent implements OnDestroy {
  @Input() set entryData(value: TableRow) {
    this._entryData = value;
    
    if (value['stream_started']) {
      this._startTimer();
    } else {
      this._stopTimer();
    }
  }
  
  private _timer: Unsubscribable;

  public _entryData: TableRow;
  public _elapsedTime: moment.Duration;
  
  ngOnDestroy(): void {
    this._stopTimer();
  }
  
  private _startTimer(): void {
    if (!this._timer) { // prevent unnecessary restart
      this._timer = ObservableTimer(0, 1000)
        .pipe(
          cancelOnDestroy(this),
          filter(() => !!this._entryData['stream_started'])
        )
        .subscribe(() => {
          this._elapsedTime = moment.duration(Math.abs(moment().diff(DateFilterUtils.getMomentDate(this._entryData['stream_started']))));
        });
    }
  }
  
  private _stopTimer(): void {
    if (this._timer) {
      this._timer.unsubscribe();
      this._timer = null;
      this._elapsedTime = moment.duration(0);
    }
  }
}
