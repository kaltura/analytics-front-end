import { Component, OnDestroy, OnInit } from '@angular/core';
import { AreaBlockerMessage } from "@kaltura-ng/kaltura-ui";

@Component({
  selector: 'app-live-entries-ended',
  templateUrl: './ended.component.html',
  styleUrls: ['./ended.component.scss'],
  providers: []
})

export class EndedComponent implements OnInit, OnDestroy {

  public _blockerMessage: AreaBlockerMessage = null;
  public _loadingEntries = false;

  ngOnInit(): void {

  }

  ngOnDestroy(): void {

  }


  constructor() {
  }



}
