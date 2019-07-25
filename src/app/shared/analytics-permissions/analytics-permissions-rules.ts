import { AnalyticsPermissions } from 'shared/analytics-permissions/analytics-permissions';

export const AnalyticsPermissionsRules: {
  customPermissionKeyToNameMapping: { [key: number]: string },
  requiredPermissionMapping: { [key: number]: AnalyticsPermissions },
  linkedPermissionMapping: { [key: number]: AnalyticsPermissions }
} = {
  customPermissionKeyToNameMapping: {},
  requiredPermissionMapping: {},
  linkedPermissionMapping: {}
};
