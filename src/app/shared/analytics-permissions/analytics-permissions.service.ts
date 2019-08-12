import { Injectable } from '@angular/core';
import { AnalyticsPermissions } from './analytics-permissions';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { AppPermissionsServiceBase } from '@kaltura-ng/mc-shared';
import { AnalyticsPermissionsRules } from 'shared/analytics-permissions/analytics-permissions-rules';

@Injectable()
export class AnalyticsPermissionsService extends AppPermissionsServiceBase<AnalyticsPermissions> {
  private _logger: KalturaLogger;
  private _restrictionsApplied = false;
  private _customPermissionNameToKeyMapping: { [name: string]: number } = {};

  constructor(logger: KalturaLogger) {
    super();
    this._logger = logger.subLogger('AnalyticsPermissionsService');
    
    Object.keys(AnalyticsPermissionsRules.customPermissionKeyToNameMapping).forEach((key) => {
      const customName = AnalyticsPermissionsRules.customPermissionKeyToNameMapping[key] as any; // bypass typescript issue with implicit type checking
      this._customPermissionNameToKeyMapping[customName] = (<any>key);
    });
  }
  
  private _getPermissionKeyByName(name: string): AnalyticsPermissions {
    const customPermissionKey = this._customPermissionNameToKeyMapping[name];
    return customPermissionKey ? customPermissionKey : AnalyticsPermissions[name];
  }
  
  public load(rawRolePermissionList: string[], rawPartnerPermissionList: string[]): void {
    
    super.flushPermissions();
    
    this._logger.info(`prepare user permissions set based on role permissions and partner permissions`);
    this._logger.trace('load()', () => ({
      rawRolePermissionList,
      rawPartnerPermissionList
    }));
    
    const rolePermissionList: Set<AnalyticsPermissions> = new Set();
    const partnerPermissionList: Set<AnalyticsPermissions> = new Set();
    const filteredRolePermissionList: Set<AnalyticsPermissions> = new Set<AnalyticsPermissions>();
    const linkedPermissionList: Set<AnalyticsPermissions> = new Set<AnalyticsPermissions>();
    let restrictionsApplied = false;
    
    const ignoredPartnerPermissionList: string[] = [];
    const ignoredRolePermissionList: string[] = [];
    
    // convert partner permission server value into app value
    rawPartnerPermissionList.forEach(rawPermission => {
      const permissionValue = this._getPermissionKeyByName(rawPermission);
      
      if (typeof permissionValue === 'undefined') {
        // ignoring partner permission since it is not in use by this app
        ignoredPartnerPermissionList.push(rawPermission);
      } else {
        partnerPermissionList.add(permissionValue);
      }
    });
    
    if (ignoredPartnerPermissionList.length) {
      this._logger.trace(`ignoring some partner permissions since they are not in use by this app.`,
        () => ({
          permissions: ignoredPartnerPermissionList.join(',')
        }));
    }
    
    // convert role permission server value into app value
    rawRolePermissionList.forEach(rawPermission => {
      const permissionValue = this._getPermissionKeyByName(rawPermission);
      
      if (typeof permissionValue === 'undefined') {
        // ignoring role permission since it is not in use by this app
        ignoredRolePermissionList.push(rawPermission);
      } else {
        rolePermissionList.add(permissionValue);
      }
    });
    
    if (ignoredRolePermissionList.length) {
      this._logger.trace(`ignoring some role permissions since they are not in use by this app`, () => ({
        permissions: ignoredRolePermissionList.join(',')
      }));
    }
    
    // traverse on each role permission and add it to user permissions set if possible
    rolePermissionList.forEach(permission => {
      const requiredPermission = AnalyticsPermissionsRules.requiredPermissionMapping[permission];
      const linkedPermission = AnalyticsPermissionsRules.linkedPermissionMapping[permission];
      
      if (requiredPermission && !partnerPermissionList.has(requiredPermission)) {
        this._logger.info(`removing role permission '${AnalyticsPermissions[permission]}' since a partner permission '${AnalyticsPermissions[requiredPermission]}' is not available`);
        restrictionsApplied = true;
      } else {
        if (linkedPermission) {
          // add the linked permission to a temporary storage
          linkedPermissionList.add(linkedPermission);
        }
        
        // add the permission to the user permissions set
        filteredRolePermissionList.add(permission);
      }
    });
    
    // traverse on linked permissions and add to user permissions set if possible
    linkedPermissionList.forEach(linkedPermission => {
      
      if (!filteredRolePermissionList.has(linkedPermission)) {
        const requiredPermission = AnalyticsPermissionsRules.requiredPermissionMapping[linkedPermission];
        
        if (!requiredPermission ||
          (requiredPermission && partnerPermissionList.has(requiredPermission))) {
          this._logger.info(`adding linked role permission '${AnalyticsPermissions[linkedPermission]}'`);
          filteredRolePermissionList.add(linkedPermission);
        }
      }
    });
    
    // Checking if can remove this loop since it appears that userRole/get returns them as well
    partnerPermissionList.forEach(permission => {
      filteredRolePermissionList.add(permission);
    });
    
    const userPermissions = Array.from(filteredRolePermissionList);
    super.loadPermissions(userPermissions);
    
    this._logger.info(`setting flag restrictionsApplied with value '${restrictionsApplied}'`);
    this._restrictionsApplied = restrictionsApplied;
  }
}
