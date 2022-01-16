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
  'FEATURE_LIKE' = 1001,
  'FEATURE_VAR_CONSOLE_LOGIN' = 1002,
  'FEATURE_MULTI_ACCOUNT_ANALYTICS' = 1003,
  'REACH_PLUGIN_PERMISSION' = 1004,
  'ANALYTICS_BASE' = 1005,
  'FEATURE_ENABLE_USAGE_DASHBOARD' = 1006,
  'FEATURE_LOAD_THUMBNAIL_WITH_KS' = 1007
}
