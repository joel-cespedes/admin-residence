import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from '@core';

export interface Permissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  private readonly authService = inject(AuthService);

  // Role-based permissions for different modules
  readonly residencePermissions = computed(() => ({
    canCreate: this.authService.isSuperAdmin(),
    canEdit: this.authService.isSuperAdmin(),
    canDelete: this.authService.isSuperAdmin(),
    canView: true // All roles can view
  }));

  readonly floorPermissions = computed(() => ({
    canCreate: this.authService.isSuperAdmin(),
    canEdit: this.authService.isSuperAdmin(),
    canDelete: this.authService.isSuperAdmin(),
    canView: true
  }));

  readonly roomPermissions = computed(() => ({
    canCreate: this.authService.isSuperAdmin(),
    canEdit: this.authService.isSuperAdmin(),
    canDelete: this.authService.isSuperAdmin(),
    canView: true
  }));

  readonly categoryPermissions = computed(() => ({
    canCreate: this.authService.isSuperAdmin() || this.authService.isManager(),
    canEdit: this.authService.isSuperAdmin() || this.authService.isManager(),
    canDelete: this.authService.isSuperAdmin() || this.authService.isManager(),
    canView: true
  }));

  readonly taskPermissions = computed(() => ({
    canCreate: this.authService.isSuperAdmin() || this.authService.isManager(),
    canEdit: this.authService.isSuperAdmin() || this.authService.isManager(),
    canDelete: this.authService.isSuperAdmin() || this.authService.isManager(),
    canView: true
  }));

  readonly devicePermissions = computed(() => ({
    canCreate: this.authService.isSuperAdmin(),
    canEdit: this.authService.isSuperAdmin(),
    canDelete: this.authService.isSuperAdmin(),
    canView: true
  }));

  readonly residentPermissions = computed(() => ({
    canCreate: this.authService.isSuperAdmin() || this.authService.isManager(),
    canEdit: this.authService.isSuperAdmin() || this.authService.isManager(),
    canDelete: this.authService.isSuperAdmin(),
    canView: true
  }));

  readonly professionalPermissions = computed(() => ({
    canCreate: this.authService.isSuperAdmin(),
    canEdit: this.authService.isSuperAdmin(),
    canDelete: this.authService.isSuperAdmin(),
    canView: true
  }));

  readonly managerPermissions = computed(() => ({
    canCreate: this.authService.isSuperAdmin(),
    canEdit: this.authService.isSuperAdmin(),
    canDelete: this.authService.isSuperAdmin(),
    canView: true
  }));

  // Generic method to check if user can perform action
  canPerformAction(module: string, action: keyof Permissions): boolean {
    const methodName = `${module}Permissions` as keyof this;
    const permissions = (this[methodName] as any)();
    return permissions[action];
  }
}
