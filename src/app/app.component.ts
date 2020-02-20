import { Component, OnInit } from '@angular/core';
import { AppService } from 'shared/services/app.service';
import { OperationTagManagerService } from '@kaltura-ng/kaltura-common';
import { observeOn } from 'rxjs/operators';
import { async } from 'rxjs/internal/scheduler/async';
import {BrowserService, GrowlMessage} from "shared/services";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public _isBusy = false;
  public _growlMessages: GrowlMessage[] = [];
  
  constructor(public _appService: AppService,
              private _operationsTagManager: OperationTagManagerService,
              private _browserService: BrowserService) {
  }
  
  ngOnInit() {
    this._appService.init();
    
    // handle app status: busy and error messages. Allow closing error window using the 'OK' button
    this._operationsTagManager.tagStatus$
      .pipe(observeOn(async))
      .subscribe((tags: { [key: string]: number }) => {
        this._isBusy = tags['block-shell'] > 0;
      });
  
    // handle app growlMessages
    this._browserService.growlMessage$.subscribe(
      (message: GrowlMessage) => {
        this._growlMessages = [ ...this._growlMessages, message ];
      }
    );
  }
}
