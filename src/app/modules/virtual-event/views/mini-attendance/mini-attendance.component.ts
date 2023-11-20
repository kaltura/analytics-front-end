import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { BehaviorSubject } from "rxjs";
import { cancelOnDestroy } from "@kaltura-ng/kaltura-common";
import { attendeesData } from "../registration-funnel/registration-funnel.component";

@Component({
  selector: 'app-ve-mini-attendance',
  templateUrl: './mini-attendance.component.html',
  styleUrls: ['./mini-attendance.component.scss'],
  providers: [
    KalturaLogger.createLogger('VEMiniAttendanceComponent')
  ]
})

export class VEMiniAttendanceComponent implements OnInit, OnDestroy{

  protected _componentId = 've-mini-attendance';

  @Input() attendees$: BehaviorSubject<{ loading: boolean, results: attendeesData[], sum: number }> = new BehaviorSubject({ loading: false, results: [], sum: 0 });
  @Input() disabled = false;

  public pre = 0;
  public during = 0;
  public post = 0;
  public max = 0;

  public _isBusy = false;

  constructor() {
  }

  ngOnInit(): void {
    if (this.attendees$) {
      this.attendees$
        .pipe(cancelOnDestroy(this))
        .subscribe(({ loading, results, sum }) => {
          this._isBusy = loading;
          results.forEach(attendees => {
            if (attendees.dimensions?.eventData?.attendanceStatus) {
               if (attendees.dimensions.eventData.attendanceStatus === "attended") {
                 this.pre += attendees.count;
               }
               if (attendees.dimensions.eventData.attendanceStatus === "participated") {
                 this.during += attendees.count;
               }
               if (attendees.dimensions.eventData.attendanceStatus === "participatedPostEvent") {
                 this.post += attendees.count;
               }
            }
          });
          this.max = Math.max(this.pre, this.during, this.post);
        });
    }
  }

  ngOnDestroy(): void {
  }

}
