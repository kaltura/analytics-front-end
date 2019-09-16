import { Component, Input } from '@angular/core';

export interface UserMiniHighlightsDevicesData {
  value: string;
  plays: string;
  rawValue: number;
  rawPlays: number;
  label: string;
  color: string;
  device: string;
  tooltip: string;
}

@Component({
  selector: 'app-user-mini-highlights-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss']
})
export class DevicesComponent {
  @Input() data: UserMiniHighlightsDevicesData[] = [];
  @Input() compare: UserMiniHighlightsDevicesData[] = [];
  @Input() isCompare = false;
  @Input() currentDates: string = null;
  @Input() compareDates: string = null;
}
