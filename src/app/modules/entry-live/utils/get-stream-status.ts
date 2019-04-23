import { KalturaEntryServerNodeStatus, KalturaViewMode } from 'kaltura-ngx-client';

export enum KalturaStreamStatus {
  live = 'Live',
  initializing = 'Initializing',
  offline = 'Offline',
  preview = 'Preview'
}

export function getStreamStatus(entryServerNodeStatus: KalturaEntryServerNodeStatus, viewMode = KalturaViewMode.allowAll): KalturaStreamStatus {
  switch (entryServerNodeStatus) {
    case KalturaEntryServerNodeStatus.authenticated:
    case KalturaEntryServerNodeStatus.broadcasting:
      return KalturaStreamStatus.initializing;
    
    case KalturaEntryServerNodeStatus.playable:
      return (viewMode === KalturaViewMode.preview) ? KalturaStreamStatus.preview : KalturaStreamStatus.live;
    
    case KalturaEntryServerNodeStatus.stopped:
    default:
      return KalturaStreamStatus.offline;
  }
}
