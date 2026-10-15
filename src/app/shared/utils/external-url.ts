// Domains and referrers come from playback traffic, so any site embedding a player can inject values here.
// Only plain hostnames (optionally with port and path) are turned into outbound URLs; anything else is dropped.
const label = '[a-z0-9_\\-\\u00a1-\\uffff]+'; // allows internationalized domain names
const host = `${label}(\\.${label})*(:\\d{1,5})?`;
const hostnamePattern = new RegExp(`^${host}$`, 'i');
const externalUrlPattern = new RegExp(`^(https?:\\/\\/)?${host}([\\/?#][^\\s\\\\]*)?$`, 'i');

export function isHostname(value: string): boolean {
  return typeof value === 'string' && hostnamePattern.test(value);
}

export function toExternalUrl(value: string): string {
  if (typeof value !== 'string' || !externalUrlPattern.test(value)) {
    return null;
  }
  return /^https?:\/\//i.test(value) ? value : `http://${value}`;
}

export function toFaviconUrl(domain: string): string {
  return isHostname(domain) ? `//${domain}/favicon.ico` : null;
}

export function openExternalUrl(value: string): void {
  const url = toExternalUrl(value);
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
