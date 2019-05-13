import { Pipe, PipeTransform } from '@angular/core';
import { AlertSeverity, StreamHealthStatus } from '../live-stream-health.types';

@Pipe({
  name: 'appSeverityToHealth'
})
export class SeverityToHealthPipe implements PipeTransform {
  
  transform(severityNumber: number | string): StreamHealthStatus {
    switch (severityNumber.toString()) {
      case AlertSeverity.error.toString():
      case AlertSeverity.critical.toString():
        return StreamHealthStatus.Poor;
      
      case AlertSeverity.warning.toString():
        return StreamHealthStatus.Fair;
      
      case AlertSeverity.debug.toString():
      case AlertSeverity.info.toString():
      default:
        return StreamHealthStatus.Good;
    }
  }
}
