import { Pipe, PipeTransform } from '@angular/core';
import { Alert, StreamHealthStatus } from '../live-stream-health.types';
import { CodeToSeverityPipe } from './code-to-severity.pipe';
import { SeverityToHealthPipe } from './severity-to-health.pipe';

@Pipe({
  name: 'appCodeToHealthIcon'
})
export class CodeToHealthIconPipe implements PipeTransform {
  constructor(private _codeToSeverityPipe: CodeToSeverityPipe,
              private _severityToHealthPipe: SeverityToHealthPipe) {
  }
  
  transform(value: number | Alert[]): string {
    const getHealth = (code) => {
      const severity = this._codeToSeverityPipe.transform(code);
      return this._severityToHealthPipe.transform(severity);
    };

    if (typeof value === 'number') {
      const health = getHealth(value);
      switch (health) {
        case StreamHealthStatus.Good:
          return 'good';
        case StreamHealthStatus.Fair:
          return 'fair';
        case StreamHealthStatus.Poor:
          return 'poor';
        default:
          return '';
      }
    } else if (Array.isArray(value)) {
      const healthList = value.map(({ Code }) => getHealth(Code));
      switch (true) {
        case healthList.indexOf(StreamHealthStatus.Poor) !== -1:
          return 'poor';
        case healthList.indexOf(StreamHealthStatus.Fair) !== -1:
          return 'fair';
        default:
          return 'good';
      }
    }
  }
}
