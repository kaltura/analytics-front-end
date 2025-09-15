import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class AttachmentsConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'extract_time': {
            format: value => value,
            sortOrder: 1,
            hidden: true,
          },
          'attachment_name': {
            format: value => value,
            sortOrder: 2,
          },
          'entry_name': {
            format: value => value,
            sortOrder: 3,
          },
          'attachment_ext': {
            format: value => value,
            sortOrder: 4,
            hidden: true,
          },
          'count_download_attachment_clicked': {
            format: value => value,
            sortOrder: 5,
            hidden: true,
          }
        }
      }
    };
  }
}
