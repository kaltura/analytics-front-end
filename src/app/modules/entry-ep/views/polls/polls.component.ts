import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {AppAnalytics, AuthService, ButtonType, ErrorsManagerService} from 'shared/services';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { analyticsConfig } from "configuration/analytics-config";
import { AreaBlockerMessage } from "@kaltura-ng/kaltura-ui";

export interface Option {
  option: string;
  nvoted: number;
  rate: number;
  isCorrect: boolean;
}

export interface Poll {
  pollId: string;
  question: string;
  type: 'OpenAnswers' | 'single' | 'multiple' | 'correct' | 'open' | 'RatingScale' | 'CrowdVote';
  nvoted: number;
  isAcceptingMultipleVotes: boolean;
  options: Option[];
  visualization?: {type: string, icon: string};
}

@Component({
  selector: 'app-ep-polls',
  templateUrl: './polls.component.html',
  styleUrls: ['./polls.component.scss'],
  providers: [
    KalturaLogger.createLogger('EpDevicesComponent')
  ]
})
export class EpPollsComponent implements OnInit, OnDestroy {

  @Input() entryId = '';
  @Input() entryName = '';
  @Input() exporting = false;
  @Input() startDate: Date;
  @Input() endDate: Date;

  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _polls: Poll[] = [];
  public _exportPolls: Poll[] = [];
  public _selectedPoll: Poll | null = null;
  public _columns: string[] = ['pollId', 'question', 'type', 'nvoted'];
  public _questionColumns: string[] = ['option', 'nvoted', 'rate'];
  public _exporting = false;

  constructor(private _errorsManager: ErrorsManagerService,
              private _http: HttpClient,
              private _authService: AuthService,
              private _analytics: AppAnalytics) {
  }

  ngOnInit() {
    this._loadReport();
  }

  ngOnDestroy() {
  }

  private _loadReport(): void {
    this._isBusy = true;
    this._blockerMessage = null;

    const headers = new HttpHeaders({
      'authorization': `KS ${this._authService.ks}`,
      'Content-Type': 'application/json',
    });

    this._http.post(`${analyticsConfig.externalServices.chatAnalyticsEndpoint.uri}/polls/analytics`, {contextId: this.entryId}, {headers}).pipe(cancelOnDestroy(this))
      .subscribe((data: any) => {
          this._polls = data.analytics;
          // update poll type
          this._polls.forEach(poll => {
            if (poll.type === 'OpenAnswers') {
              poll.type = 'open';
            } else {
              poll.type = poll.isAcceptingMultipleVotes ? 'multiple' : 'single';
              if (poll.visualization) {
                poll.type = poll.visualization.type === 'rating scale' ? 'RatingScale' : poll.visualization.type === 'crowd vote' ? 'CrowdVote' : poll.type;
              }
              poll.options.forEach(option => {
                if (option.isCorrect) {
                  poll.type = 'correct';
                }
              });
            }
            // for poll options, add rate
            let pollTotalVotes = 0;
            poll.options.forEach(option => {
              pollTotalVotes += option.nvoted;
            });
            poll.options.forEach(option => {
              option.rate = pollTotalVotes > 0 ? Math.round(option.nvoted / pollTotalVotes * 10000 ) / 100  : 0;
            });
            if (poll.visualization) {
              console.log(poll);
            }
          });
          this._exportPolls = this._polls.slice(0, 10); // for export use the first 10 polls
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._loadReport();
            }
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });

  }

  public drillDown(poll: Poll): void {
    if (poll.type !== 'open') {
      this._analytics.trackButtonClickEvent(ButtonType.Navigate, 'Events_session_polls_question_click', poll.type, 'session_dashboard');
      this._selectedPoll = poll;
    }
  }

  public drillUp(): void {
    this._analytics.trackButtonClickEvent(ButtonType.Navigate, 'Events_session_polls_all_polls', null, 'session_dashboard');
    this._selectedPoll = null;
  }

  public preExportHandler(): void {
    this._analytics.trackButtonClickEvent(ButtonType.Navigate, 'Events_session_polls_download_pdf', null, 'session_dashboard');
  }

  public onPage(event: any): void {
    this._analytics.trackButtonClickEvent(ButtonType.Browse, 'Events_session_polls_paginate', event.page, 'session_dashboard');
  }

  public onExporting(exporting: boolean): void {
    this._exporting = exporting;
  }

}
