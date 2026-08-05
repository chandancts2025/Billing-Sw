import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../auth/auth.models';

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly auth = inject(AuthService);
  readonly user = this.auth.user;
  readonly role = this.auth.role;
  readonly permissions = computed(() => {
    const role = this.role();
    return {
      canManageSettings: role === 'SuperAdmin',
      canManageUsers: role === 'SuperAdmin' || role === 'Admin',
      canViewReports: !!role,
      canApproveInventory: role === 'SuperAdmin' || role === 'Admin'
    };
  });

  hasRoleAtLeast(role: UserRole): boolean {
    return this.auth.hasRoleAtLeast(role);
  }
}
