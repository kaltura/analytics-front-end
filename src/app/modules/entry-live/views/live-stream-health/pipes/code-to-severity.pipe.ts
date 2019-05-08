import { Pipe, PipeTransform } from '@angular/core';
import { AlertSeverity, DiagnosticsErrorCodes } from '../live-stream-health.types';

@Pipe({
  name: 'appCodeToSeverity'
})
export class CodeToSeverityPipe implements PipeTransform {
  transform(code: number): number {
    
    switch (code) {
      case DiagnosticsErrorCodes.BitrateUnmatched:
      case DiagnosticsErrorCodes.EntryStopped:
      case DiagnosticsErrorCodes.EntryStarted:
      case DiagnosticsErrorCodes.InvalidKeyFrameInterval:
      case DiagnosticsErrorCodes.HighFpsRate:
      case DiagnosticsErrorCodes.BackupOnlyStreamNoRecording:
        return AlertSeverity.info;
      
      case DiagnosticsErrorCodes.EntryRestarted:
      case DiagnosticsErrorCodes.BackupOnlyStreamRecording:
        return AlertSeverity.warning;
      
      case DiagnosticsErrorCodes.NoAudioSignal:
      case DiagnosticsErrorCodes.NoVideoSignal:
      case DiagnosticsErrorCodes.PtsDrift:
        return AlertSeverity.error;
      case DiagnosticsErrorCodes.AuthenticationInvalidToken:
      case DiagnosticsErrorCodes.AuthenticationIncorrectStream:
      case DiagnosticsErrorCodes.AuthenticationEntryNotFound:
      case DiagnosticsErrorCodes.AuthenticationNoLivePermission:
      case DiagnosticsErrorCodes.AuthenticationTooManyStreams:
      case DiagnosticsErrorCodes.AuthenticationTooManyTranscodedStreams:
        return AlertSeverity.critical;
      
      default:
        return AlertSeverity.info;
    }
  }
}
