export enum StreamHealthStatus {
  Good = 'Good',
  Fair = 'Fair',
  Poor = 'Poor',
}

export enum DiagnosticsErrorCodes {
  EntryRestarted = 100,
  BitrateUnmatched = 101,
  NoAudioSignal = 102,
  NoVideoSignal = 103,
  PtsDrift = 104,
  EntryStopped = 105,
  EntryStarted = 106,
  InvalidKeyFrameInterval = 107,
  HighFpsRate = 108,
  BackupOnlyStreamNoRecording = 109,
  BackupOnlyStreamRecording = 110,
  AuthenticationInvalidToken = 111,
  AuthenticationIncorrectStream = 112,
  AuthenticationEntryNotFound = 113,
  AuthenticationNoLivePermission = 114,
  AuthenticationTooManyStreams = 115,
  FrameRateIsFluctuatingOnFlavor = 116,
  FrameRateIsDifferentThanConfigured = 117,
  AuthenticationTooManyTranscodedStreams = 118,
  ResolutionLimitedByBandwidth = 119,
  ResolutionLimitedByCPU = 120,
  BandwidthBackToNormal = 121,
  CPUBackToNormal = 122,
  M3U8ChunkWithInvalidDurationAlert = 123,
  InconsistentFrameRateAlert = 124,
  LimitRate = 125,
  LiveStreamAlreadyBroadcasting = 126
}

export enum AlertSeverity {
  debug = 0,
  info = 1,
  warning = 2,
  error = 3,
  critical = 4
}

export interface FlavorParams {
  bitrate_kbps?: number;
  resolution?: number[];
  framesPerSecond?: number;
  lastChunkName?: string;
  keyFramesDistance?: number;
  drift?: {
    deltaClock?: number,
    deltaPts?: number,
    refEncoderDts?: number,
    refPts?: number,
    time?: Date
  };
}

export interface InputStreamObject {
  index: string;
  bitrate: number;
  ptsData: number[][];
}

export interface FlavorObject {
  name?: string;
  runStatus?: string;
  lastM3U8Time?: string;
  mediaInfo?: FlavorParams;
  wowzaUrl?: string;
}

export interface Alert {
  Time?: Date;
  Code?: any;
  Arguments?: any;
}

export interface StreamHealth {
  id?: number;
  updatedTime?: number;
  updatedFormattedTime?: string;
  severity?: number;
  isPrimary?: boolean;
  alerts?: Alert[];
}

export interface DiagnosticsHealthInfo {
  primary?: StreamHealth[];
  secondary?: StreamHealth[];
}

export interface DiagnosticsDynamicInfo {
  inputs?: InputStreamObject[];
  flavors?: FlavorObject[];
}

export interface LiveEntryDiagnosticsInfo {
  staticInfoPrimary?: { updatedTime?: number, data?: Object };
  staticInfoSecondary?: { updatedTime?: number, data?: Object };
  dynamicInfoPrimary?: { updatedTime?: number, data?: DiagnosticsDynamicInfo };
  dynamicInfoSecondary?: { updatedTime?: number, data?: DiagnosticsDynamicInfo };
  streamHealth?: { updatedTime?: number, data?: DiagnosticsHealthInfo };
  selfServe?:  { updatedTime?: number, data?: boolean };
}
