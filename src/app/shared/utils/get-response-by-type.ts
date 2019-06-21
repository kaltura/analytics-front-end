import { KalturaResponse } from 'kaltura-ngx-client';

export function getResponseByType<T>(responses: KalturaResponse<any>[], type: any): T {
  const isType = t => r => r.result instanceof t || Array.isArray(r.result) && r.result.length && r.result[0] instanceof t;
  const result = Array.isArray(responses) ? responses.find(response => isType(type)(response)) : null;
  return result ? result.result : null;
}
