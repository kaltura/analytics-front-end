import * as moment from "moment";

export class ReportHelper {
  static numberWithCommas(x: any): string {
    return parseFloat(x).toLocaleString(navigator.language, { maximumSignificantDigits: 20 });
  }
  
  static percents(x: any): string {
    return x.length ? this.numberWithCommas((parseFloat(x) * 100).toFixed(2)) + '%' : 'N/A';
  }
  
  static numberOrNA(x: any): string {
    return x.length ? ReportHelper.numberWithCommas(Math.round(parseFloat(x))) : 'N/A';
  }
  
  static numberOrZero(x: any, round = true): string {
    x = parseFloat(x);
    if (isNaN(x)) {
      return '0';
    } else {
      x = x % 1 === 0
        ? round ? Math.round(x) : x
        : x.toFixed(2);
      
      return ReportHelper.numberWithCommas(x);
    }
  }

  static integerOrZero(x: any, round = true): string {
    x = parseInt(x);
    return this.numberOrZero(x, round);
  }
  
  static time(x: any): string {
    if (!x.length) {
      return '00:00';
    }
    const numValue = Math.abs(parseFloat(x));
    const wholeMinutes = Math.floor(numValue / 60000);
    const wholeSeconds = Math.floor((numValue - (wholeMinutes * 60000)) / 1000);
    const secondsText = wholeSeconds < 10 ? '0' + wholeSeconds.toString() : wholeSeconds.toString();
    let formattedTime = wholeMinutes.toString() + ':' + secondsText;
    
    if (parseFloat(x) < 0) {
      formattedTime = '-' + formattedTime;
    }
    return formattedTime;
  }
  
  static underscoreToSpace(x: string): string {
    return x.replace('_', ' ');
  }
  
  static format(param: string, value: string): string {
    let result: string = value;
    
    switch (param) {
      case 'count_plays':
      case 'count_plays_25':
      case 'count_plays_50':
      case 'count_plays_75':
      case 'count_plays_100':
      case 'distinct_plays':
      case 'count_total':
      case 'count_ugc':
      case 'count_admin':
      case 'count_video':
      case 'count_audio':
      case 'count_download':
      case 'count_report':
      case 'count_viral':
      case 'count_edit':
      case 'count_image':
      case 'count_mix':
      case 'count_loads':
        // format as number
        result = this.numberWithCommas(parseInt(value));
        break;
      case 'serverDate':
        const date = new Date(Number(value) * 1000);
        result = moment(date).format('MMM D, YYYY');
        break;
      case 'avg_view_drop_off':
      case 'play_through_ratio':
      case 'load_play_ratio':
        // format as percents
        const perc = parseFloat(value) * 100;
        result = this.numberWithCommas(perc) + '%';
        break;
      /*
            case 'sum_time_viewed':
            case 'avg_time_viewed':
              // format as HH:MM:SS
              return KTimeUtil.formatTime2(Number(value) * 60);
              break;
            case 'event_date_id':
              return new Date(Number(value) * 1000).toDatestring();
              break;
      
            case 'entry_media_source_name':
              return getLocalised('sourceTypes', value);
              break;
      
            case 'country':
              return getLocalised('map', value);
              break;
            case 'date_id':
              return FormattingUtil.formatFullDatestring(value);
              break;
            case 'month_id':
              return FormattingUtil.formatMonthstring(value);
              break;*/
      case 'bandwidth_consumption':
      case 'storage_used':
      case 'used_storage':
      case 'combined_bandwidth_storage':
      case 'added_storage_mb':
      case 'deleted_storage_mb':
      case 'total_storage_mb':
      case 'average_storage':
      case 'peak_storage':
      case 'added_storage':
      case 'deleted_storage':
      case 'transcoding_consumption':
      case 'aggregated_monthly_avg_storage':
      case 'combined_bandwidth_aggregated_storage':
        result = value.length ? this.numberWithCommas(Math.round(parseFloat(value))) : 'N/A';
        break;
      case 'added_msecs':
      case 'deleted_msecs':
      case 'total_msecs':
        const numValue = Math.abs(parseFloat(value));
        const wholeMinutes = Math.floor(numValue / 60000);
        const wholeSeconds = Math.floor((numValue - (wholeMinutes * 60000)) / 1000);
        const secondsText = wholeSeconds < 10 ? '0' + wholeSeconds.toString() : wholeSeconds.toString();
        let formattedTime = wholeMinutes.toString() + ':' + secondsText;
        
        if (parseFloat(value) < 0) {
          formattedTime = '-' + formattedTime;
        }
        result = formattedTime;
        break;
      case 'device':
      case 'os':
      case 'browser':
        // replace '_' with space
        result = value.replace('_', ' ');
        break;
      
    }
    return result;
  }
}
