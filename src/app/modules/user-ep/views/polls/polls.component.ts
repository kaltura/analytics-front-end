import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AppAnalytics, AuthService, ButtonType, ErrorsManagerService } from 'shared/services';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { analyticsConfig } from "configuration/analytics-config";
import { AreaBlockerMessage } from "@kaltura-ng/kaltura-ui";
import { TranslateService } from "@ngx-translate/core";
import { BaseEntryListAction, KalturaBaseEntryFilter, KalturaBaseEntryListResponse, KalturaClient, KalturaDetachedResponseProfile, KalturaFilterPager, KalturaResponseProfileType } from "kaltura-ngx-client";

export interface Option {
  option: string;
  isCorrect: boolean;
}

export interface Poll {
  pollId: string;
  question: string;
  contextId: string;
  groupPollId?: string;
  groupPollName?: string;
  pollType: 'OpenAnswers' | 'OptionsPoll';
  votedAt: string;
  vote?: number[];
  openAnswer?: string;
  hasAnswered: boolean;
  isAcceptingMultipleVotes: boolean;
  options: Option[];
  pollVisualization?: {type: string, icon: string};
}

export interface PollRow {
  id: string;
  isSurvey: boolean;
  type: 'OpenAnswers' | 'OptionsPoll';
  question: string;
  answer: string;
  session: string;
  hasAnswered: boolean;
  pollVisualization?: {type: string, icon: string};
}

@Component({
  selector: 'app-ep-user-polls',
  templateUrl: './polls.component.html',
  styleUrls: ['./polls.component.scss'],
  providers: [
    KalturaLogger.createLogger('EpUserPollsComponent')
  ]
})
export class EpUserPollsComponent implements OnInit, OnDestroy {

  @Input() exporting = false;
  @Input() startDate: Date;
  @Input() endDate: Date;
  @Input() userId = '';

  @Output() onPollsLoaded = new EventEmitter<number>();

  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;
  private pollsAndSurveys: Poll[] = [];
  public _polls: PollRow[] = [];
  public _survey: PollRow[] = [];
  public _surveyQuestionsAnswered = 0;
  public _selectedPoll: PollRow = null;
  public _columns: string[] = ['id', 'question', 'answer', 'session'];
  public _questionColumns: string[] = ['id', 'question', 'answer'];
  public _exporting = false;

  constructor(private _errorsManager: ErrorsManagerService,
              private _http: HttpClient,
              private _kalturaClient: KalturaClient,
              private _translate: TranslateService,
              private _authService: AuthService,
              private _analytics: AppAnalytics) {
  }

  ngOnInit() {
    this._loadReport();
  }

  ngOnDestroy() {
  }

  private _loadReport(contextId = null): void {
    this._isBusy = true;
    this._blockerMessage = null;

    const headers = new HttpHeaders({
      'authorization': `KS ${this._authService.ks}`,
      'Content-Type': 'application/json',
    });

    const body = contextId ? {userId: this.userId, contextId} : {userId: this.userId};

    this._http.post(`${analyticsConfig.externalServices.chatAnalyticsEndpoint.uri}/polls/userAnalytics`, body, {headers}).pipe(cancelOnDestroy(this))
      .subscribe((data: any) => {
        this.pollsAndSurveys = data?.analytics?.interactions || [];
        const sessionIds = [];

        this.pollsAndSurveys.forEach(poll => {
          if (poll.contextId && sessionIds.indexOf(poll.contextId) === -1) {
            sessionIds.push(poll.contextId);
          }
          if (poll.groupPollId && this._polls.findIndex(p => p.id === poll.groupPollId) === -1) {
            this._polls.push({
              id: poll.groupPollId,
              isSurvey: true,
              question: this._translate.instant('app.userEp.survey'),
              type: poll.pollType,
              hasAnswered: poll.hasAnswered,
              answer: '',
              session: poll.contextId,
              pollVisualization: poll.pollVisualization
            });
          } else if (!poll.groupPollId && poll.hasAnswered) {
            this._polls.push({
              id: poll.pollId,
              isSurvey: false,
              question: poll.question,
              type: poll.pollType,
              hasAnswered: poll.hasAnswered,
              answer: poll.openAnswer ? poll.openAnswer : poll.vote ? poll.vote.map(v => poll.options[v] ? poll.options[v].option : '').join(', ') : '',
              session: poll.contextId,
              pollVisualization: poll.pollVisualization
            });
          }
          this.onPollsLoaded.emit(this._polls.length);
        });

        // load session names
        if (sessionIds.length > 0) {
          const request = new BaseEntryListAction({
            pager: new KalturaFilterPager({pageIndex: 1, pageSize: 500}),
            filter: new KalturaBaseEntryFilter({idIn: sessionIds.join(','), statusIn: '0,1,2,3,4,5,6,7'})
          })
            .setRequestOptions({
              responseProfile: new KalturaDetachedResponseProfile({
                type: KalturaResponseProfileType.includeFields,
                fields: 'id,name'
              })
            });

          this._kalturaClient
            .request(request)
            .pipe(cancelOnDestroy(this))
            .subscribe((response: KalturaBaseEntryListResponse) => {
                if (response.objects.length) {
                  // update polls with session names
                  this._polls.forEach(poll => {
                    const entry = response.objects.find(e => e.id === poll.session);
                    if (entry) {
                      poll.session = entry.name;
                    }
                  });
                }
                this._isBusy = false;
              },
              error => {
                console.error(error);
                this._isBusy = false;
              });
          } else {
            this._isBusy = false;
          }
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

  public drillDown(poll: PollRow, col: string): void {
    if (col === 'question') {
      this._survey = [];
      this._surveyQuestionsAnswered = 0;
      this.pollsAndSurveys.forEach(p => {
        if (p.groupPollId === poll.id) {
          this._survey.push({
            id: p.pollId,
            isSurvey: false,
            question: p.question,
            type: p.pollType,
            hasAnswered: p.hasAnswered,
            answer: p.openAnswer ? p.openAnswer : p.vote ? p.vote.map(v => p.options[v] ? p.options[v].option : '').join(', ') : this._translate.instant('app.userEp.noAnswer'),
            session: p.contextId,
            pollVisualization: p.pollVisualization
          });
          if (p.hasAnswered) {
            this._surveyQuestionsAnswered++;
          }
        }
      });
    }
  }

  public drillUp(): void {
    this._survey = [];
  }

  public onPage(event: any): void {
    this._analytics.trackButtonClickEvent(ButtonType.Browse, 'Events_session_polls_paginate', event.page, 'session_dashboard');
  }

}
