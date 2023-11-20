import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { BehaviorSubject } from "rxjs";
import { cancelOnDestroy } from "@kaltura-ng/kaltura-common";
import { attendeesData } from "../registration-funnel/registration-funnel.component";

type origin = {key: string, total: number, attended: number, notAttended: number};

@Component({
  selector: 'app-ve-mini-origin',
  templateUrl: './mini-origin.component.html',
  styleUrls: ['./mini-origin.component.scss'],
  providers: [
    KalturaLogger.createLogger('VEMiniOriginComponent')
  ]
})

export class VEMiniOriginComponent implements OnInit, OnDestroy{

  protected _componentId = 've-mini-origin';

  @Input() attendees$: BehaviorSubject<{ loading: boolean, results: attendeesData[], sum: number }> = new BehaviorSubject({ loading: false, results: [], sum: 0 });
  @Input() disabled = false;

  private registration: origin = {key: 'registration', total:0, attended: 0, notAttended: 0};
  private webhook: origin = {key: 'webhook', total:0, attended: 0, notAttended: 0};
  private invite: origin = {key: 'invite', total:0, attended: 0, notAttended: 0};
  private admin: origin = {key: 'admin', total:0, attended: 0, notAttended: 0};
  private sso: origin = {key: 'sso', total:0, attended: 0, notAttended: 0};

  public _allAttendees = 0;
  public _origins = [this.registration, this.webhook, this.invite, this.admin, this.sso];
  public _isBusy = false;

  constructor() {
  }

  ngOnInit(): void {
    if (this.attendees$ && !this.disabled) {
      this.attendees$
        .pipe(cancelOnDestroy(this))
        .subscribe(({ loading, results, sum }) => {
          this._isBusy = loading;
          this._allAttendees = sum;
          results.forEach(attendees => {
            if (attendees.dimensions?.eventData?.regOrigin) {
              const origin = this[attendees.dimensions.eventData.regOrigin];
              origin.total += attendees.count;
              if (attendees.dimensions.eventData.attendanceStatus === "participated") {
                origin.attended += attendees.count;
              } else {
                origin.notAttended += attendees.count;
              }
            }
          });
        });
    }
  }

  ngOnDestroy(): void {
  }

}
