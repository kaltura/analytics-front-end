import { Observable, of as ObservableOf } from 'rxjs';
import { Injectable } from '@angular/core';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { LiveStreamHealthRequestFactory } from './live-stream-health-request-factory';
import { KalturaBeacon, KalturaBeaconListResponse } from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { analyticsConfig } from 'configuration/analytics-config';
import * as moment from 'moment';
import { CodeToSeverityPipe } from './pipes/code-to-severity.pipe';
import { DiagnosticsHealthInfo, LiveEntryDiagnosticsInfo, StreamHealth } from './live-stream-health.types';
import { EntryLiveGeneralPollsService } from '../../providers/entry-live-general-polls.service';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';

@Injectable()
export class LiveStreamHealthWidget extends WidgetBase<LiveEntryDiagnosticsInfo> {
  protected _widgetId = 'stream-health';
  protected _pollsFactory = null;
  
  constructor(protected _serverPolls: EntryLiveGeneralPollsService,
              protected _frameEventManager: FrameEventManagerService,
              protected _logger: KalturaLogger,
              private _codeToSeverityPipe: CodeToSeverityPipe) {
    super(_serverPolls, _frameEventManager);
    this._logger = _logger.subLogger('LiveStreamHealthWidget');
    
    this._data.next({
      staticInfoPrimary: { updatedTime: 0 },
      staticInfoSecondary: { updatedTime: 0 },
      dynamicInfoPrimary: { updatedTime: 0 },
      dynamicInfoSecondary: { updatedTime: 0 },
      streamHealth: { updatedTime: Date.now(), data: { primary: [], secondary: [] } }
    });
  }
  
  protected _onRestart(): void {
    this._pollsFactory = new LiveStreamHealthRequestFactory(this._activationArgs.entryId);
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveStreamHealthRequestFactory(widgetsArgs.entryId);
    
    return ObservableOf(null);
  }
  
  protected _responseMapping(responses: KalturaBeaconListResponse): LiveEntryDiagnosticsInfo {
    this._pollsFactory.removePager();

    const beaconsArray: KalturaBeacon[] = responses.objects;
    let entryDiagnosticsObject = this._currentData;
  
    this._pollsFactory.lastUpdateTime = entryDiagnosticsObject.streamHealth.updatedTime;

    if (beaconsArray.length) {
      // Make sure last beacon's updatedTime in the array matches the last one received by service and remove it.
      if (entryDiagnosticsObject.streamHealth.updatedTime === beaconsArray[beaconsArray.length - 1].updatedAt.valueOf()) {
        beaconsArray.pop();
      }
    }
    // Iterate through beacons list from oldest report to most recent
    beaconsArray.forEach(b => {
      try {
        let privateData = JSON.parse(b.privateData);
        let eventType = b.eventType.substring(2);
        let isPrimary = (b.eventType[0] === '0');
        let beaconUpdateTime = b.updatedAt.valueOf();
        
        let objectToUpdate = this._getDiagnosticsObjToUpdate(entryDiagnosticsObject, eventType, isPrimary);
        if (objectToUpdate && (beaconUpdateTime !== objectToUpdate.updatedTime)) {
          if (eventType === 'healthData') {
            this._handleHealthBeacon(beaconUpdateTime, isPrimary, privateData, objectToUpdate);
          } else {
            objectToUpdate.data = privateData;
          }
        }
        // Only if beacon report time is higher (meaning more recent) than last one saved, replace it
        if (beaconUpdateTime > objectToUpdate.updatedTime) {
          objectToUpdate.updatedTime = this._pollsFactory.lastUpdateTime = beaconUpdateTime;
        }
      } catch (error) {
        this._logger.error('Error parsing beacon', error);
      }
    });
    
    return entryDiagnosticsObject;
  }
  
  private _getDiagnosticsObjToUpdate(entryDiagnosticsObject: LiveEntryDiagnosticsInfo, event: string, isPrimary: boolean): { updatedFormattedTime?: string, updatedTime?: number, data?: any } {
    switch (event) {
      case 'staticData':
        return (isPrimary) ? entryDiagnosticsObject.staticInfoPrimary : entryDiagnosticsObject.staticInfoSecondary;
      case 'dynamicData':
        return (isPrimary) ? entryDiagnosticsObject.dynamicInfoPrimary : entryDiagnosticsObject.dynamicInfoSecondary;
      case 'healthData':
        return entryDiagnosticsObject.streamHealth;
      default:
        this._logger.warn(`Beacon event Type unknown: ${event}`, { event });
        return null;
    }
  }
  
  private _handleHealthBeacon(beaconTime: number, isPrimary: boolean, metaData: any, diagnosticsObject: { updatedTime?: number, data?: DiagnosticsHealthInfo }): void {
    let report = {
      updatedTime: beaconTime,
      updatedFormattedTime: moment(beaconTime).format(analyticsConfig.dateFormat === 'month-day-year' ? 'HH:mm MM/DD/YYYY' : 'HH:mm DD/MM/YYYY'),
      severity: metaData.maxSeverity,
      isPrimary: isPrimary,
      alerts: Array.isArray(metaData.alerts)
        ? metaData.alerts.filter((s1, pos, arr) => arr.findIndex(s2 => s2.Code === s1.Code) === pos) // filter uniq by `Code`
        : []
    };

    report.alerts.sort((a, b) =>
      this._codeToSeverityPipe.transform(b.Code).valueOf() - this._codeToSeverityPipe.transform(a.Code).valueOf()
    );
    // For each report add it to the beginning of the array.
    // If array contains the maximum number of elements allowed, erase the last one and add the most recent one.
    if (isPrimary) {
      if ((<StreamHealth[]>diagnosticsObject.data.primary).length === analyticsConfig.live.healthNotificationsCount) {
        (<StreamHealth[]>diagnosticsObject.data.primary).pop();
      }
      (<StreamHealth[]>diagnosticsObject.data.primary).splice(0, 0, report);
    } else {
      if ((<StreamHealth[]>diagnosticsObject.data.secondary).length === analyticsConfig.live.healthNotificationsCount) {
        (<StreamHealth[]>diagnosticsObject.data.secondary).pop();
      }
      (<StreamHealth[]>diagnosticsObject.data.secondary).splice(0, 0, report);
    }
  }
}
