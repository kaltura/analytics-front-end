import { Component, Input, OnDestroy } from '@angular/core';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { TranslateService } from "@ngx-translate/core";
import { ISubscription } from "rxjs/Subscription";
import { KalturaClient, UserGetAction } from "kaltura-ngx-client";

@Component({
  selector: 'app-entry-live-details-overlay',
  templateUrl: './entry-details-overlay.component.html',
  styleUrls: ['./entry-details-overlay.component.scss'],
})
export class EntryDetailsOverlayComponent implements OnDestroy {
  @Input() set entryData(value: TableRow) {
    this._entryData = value;
    if (this._entryData['creator'].length) {
      this.loadCreatorName(this._entryData['creator']);
    } else {
      this._creator = this._translate.instant('app.common.na');
    }
  }

  public _creator = '';
  public _entryData: TableRow;

  private creatorSubscription: ISubscription = null;

  constructor(private _kalturaClient: KalturaClient, private _translate: TranslateService) {
  }

  private loadCreatorName(userId: string): void {
    this._kalturaClient
      .request(new UserGetAction({ userId }))
      .pipe(cancelOnDestroy(this))
      .subscribe(
        (user) => {
          this._creator = user.fullName;
        },
        error => {
          this._creator = this._translate.instant('app.common.na');
        });
  }

  ngOnDestroy(): void {
  }
}
