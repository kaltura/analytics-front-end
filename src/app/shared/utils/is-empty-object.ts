export function isEmptyObject(value: any): boolean {
  return (value && !Object.keys(value).length);
}
