import { KalturaEndUserReportInputFilter, KalturaReportExportItemType, KalturaReportType } from 'kaltura-ngx-client';

export interface ExportItem {
  id?: string;
  label?: string;
  reportType?: KalturaReportType;
  sections?: KalturaReportExportItemType[];
  order?: string;
  objectIds?: string;
  startDate?: number | Function;
  endDate?: number | Function;
  additionalFilters?: Partial<KalturaEndUserReportInputFilter>;
  ownerId?: string;
  items?: ExportItem[];
}

export abstract class ExportConfigService {
  public static updateConfig(config: ExportItem[], configId: string, update: Partial<ExportItem>): ExportItem[] {
    const relevantConfigItem = config.find(({ id }) => id === configId);
    const relevantConfigItemIndex = config.indexOf(relevantConfigItem);
    let result = [...config];
    if (relevantConfigItemIndex !== -1) {
      Object.keys(update).forEach(key => {
        relevantConfigItem[key] = update[key];
      });
      
      result = [
        ...result.slice(0, relevantConfigItemIndex),
        relevantConfigItem,
        ...result.slice(relevantConfigItemIndex + 1),
      ];
    }
    
    return result;
  }
  
  public abstract getConfig(param?: unknown): ExportItem[];
}
