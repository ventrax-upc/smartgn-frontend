import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '../../../../modules/iam/application/auth.store';

interface SidebarOption {
  link: string;
  label: string;
  icon: string;
  exact?: boolean;
}

/*
  Sidebar navigation follows the real session: the same USER role has two
  different menus depending on accountKind (principal owner vs delegated
  subuser), while SuperAdmin sees the operations console only.
*/
@Component({
  selector: 'app-sidebar-content',
  imports: [RouterLink, RouterLinkActive, MatIcon, TranslatePipe],
  templateUrl: './sidebar-content.html',
  styleUrl: './sidebar-content.css',
})
export class SidebarContent {
  private readonly authStore = inject(AuthStore);

  private readonly principalOptions: SidebarOption[] = [
    { link: '/home', label: 'sidebar.home', icon: 'grid_view', exact: true },
    { link: '/installation/properties', label: 'sidebar.properties', icon: 'home_work' },
    { link: '/installation/meters', label: 'sidebar.meters', icon: 'speed' },
    { link: '/installation/devices', label: 'sidebar.devices', icon: 'developer_board' },
    { link: '/account/subusers', label: 'sidebar.subusers', icon: 'group' },
    { link: '/payments/subscription', label: 'sidebar.subscription', icon: 'workspace_premium' },
    { link: '/payments/history', label: 'sidebar.payments', icon: 'receipt_long' },
    { link: '/support/tickets', label: 'sidebar.tickets', icon: 'support_agent' },
    { link: '/support/visits', label: 'sidebar.visits', icon: 'event' },
    { link: '/support/guides', label: 'sidebar.guides', icon: 'menu_book' },
    { link: '/account/profile', label: 'sidebar.profile', icon: 'person' },
  ];

  private readonly delegatedOptions: SidebarOption[] = [
    { link: '/home', label: 'sidebar.home', icon: 'grid_view', exact: true },
    { link: '/installation/meters', label: 'sidebar.meters', icon: 'speed' },
    { link: '/installation/devices', label: 'sidebar.devices', icon: 'developer_board' },
    { link: '/support/tickets', label: 'sidebar.tickets', icon: 'support_agent' },
    { link: '/support/visits', label: 'sidebar.visits', icon: 'event' },
    { link: '/support/guides', label: 'sidebar.guides', icon: 'menu_book' },
    { link: '/account/profile', label: 'sidebar.profile', icon: 'person' },
  ];

  private readonly adminOptions: SidebarOption[] = [
    { link: '/home', label: 'sidebar.home', icon: 'grid_view', exact: true },
    { link: '/installation/installations', label: 'sidebar.installations', icon: 'home_repair_service' },
    { link: '/installation/devices', label: 'sidebar.devices', icon: 'developer_board' },
    { link: '/installation/installers', label: 'sidebar.installers', icon: 'engineering' },
    { link: '/support/tickets', label: 'sidebar.tickets', icon: 'support_agent' },
    { link: '/support/visits', label: 'sidebar.visits', icon: 'event' },
    { link: '/support/technicians', label: 'sidebar.technicians', icon: 'badge' },
    { link: '/support/guides', label: 'sidebar.guides', icon: 'menu_book' },
    { link: '/account/profile', label: 'sidebar.profile', icon: 'person' },
  ];

  protected readonly options = computed<SidebarOption[]>(() => {
    if (this.authStore.isSuperAdmin()) return this.adminOptions;
    return this.authStore.isDelegated() ? this.delegatedOptions : this.principalOptions;
  });
}
