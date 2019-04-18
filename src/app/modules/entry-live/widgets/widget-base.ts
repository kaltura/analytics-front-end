export enum WidgetStatus {
  activated = 'activated',
  deactivated = 'deactivated',
}

export abstract class WidgetBase {
  private _status: WidgetStatus;
  
  public pollRequest(): any {
  
  }
  
  public onActivate(): any {
  
  }
}
