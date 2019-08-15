/**
 * A list of permission tokens as provided by the server and supported in the KMC.
 *
 * DEVELOPER NOTICE:
 * - All the tokens must be UPPER_CASED and use underline (_) instead of dot ('.')
 * - if the original name doesn't match the naming standards, add the mapping manually in file 'kmc-permissions-rules' property 'customPermissionKeyToNameMapping'
 *
 */
export enum AnalyticsPermissions {
  'DYNAMIC_FLAG_KMC_CHUNKED_CATEGORY_LOAD' = 1000,
  'FEATURE_LIVE_ANALYTICS_DASHBOARD' = 1001,
  'FEATURE_VAR_CONSOLE_LOGIN' = 1127,
}
