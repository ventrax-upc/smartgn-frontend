import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '../../../../modules/iam/application/auth.store';
import { ChangePasswordDialog } from '../../../../modules/iam/presentation/views/change-password-dialog/change-password-dialog';

@Component({
  selector: 'app-toolbar-content',
  imports: [
    RouterLink,
    MatToolbar,
    MatToolbarRow,
    MatIconButton,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    TranslatePipe,
  ],
  templateUrl: './toolbar-content.html',
  styleUrl: './toolbar-content.css',
})
export class ToolbarContent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  protected readonly currentUser = this.authStore.currentUser;
  protected readonly displayName = this.authStore.displayName;
  protected readonly initials = this.authStore.initials;

  protected readonly roleLabel = computed(() => {
    if (this.authStore.isSuperAdmin()) return 'SuperAdmin';
    return this.authStore.isDelegated() ? 'Delegated user' : 'Account owner';
  });

  protected logout(): void {
    this.authStore.logout();
    this.router.navigate(['/sign-in']);
  }

  protected openChangePassword(): void {
    this.dialog.open(ChangePasswordDialog, { width: '420px' });
  }
}
