import { Component, OnInit, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { AuthStore } from '../../../../iam/application/auth.store';
import { SubusersStore } from '../../../../iam/application/subusers.store';
import { PropertiesStore } from '../../../../installation/application/properties.store';
import { MetersStore } from '../../../../installation/application/meters.store';
import { DevicesStore } from '../../../../installation/application/devices.store';
import { InstallationsStore } from '../../../../installation/application/installations.store';
import { InstallersStore } from '../../../../installation/application/installers.store';
import { TicketsStore } from '../../../../support/application/tickets.store';
import { VisitsStore } from '../../../../support/application/visits.store';
import { TechniciansStore } from '../../../../support/application/technicians.store';
import { Ticket, TicketStatus } from '../../../../support/domain/model/ticket.entity';
import { SubscriptionStore } from '../../../../payment/application/subscription.store';
import { PaymentsStore } from '../../../../payment/application/payments.store';

interface QuickAction {
  link: string;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DatePipe, RouterLink, MatIcon],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardPage implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly subusersStore = inject(SubusersStore);
  private readonly propertiesStore = inject(PropertiesStore);
  private readonly metersStore = inject(MetersStore);
  private readonly devicesStore = inject(DevicesStore);
  private readonly installationsStore = inject(InstallationsStore);
  private readonly installersStore = inject(InstallersStore);
  private readonly ticketsStore = inject(TicketsStore);
  private readonly visitsStore = inject(VisitsStore);
  private readonly techniciansStore = inject(TechniciansStore);
  private readonly subscriptionStore = inject(SubscriptionStore);
  private readonly paymentsStore = inject(PaymentsStore);

  protected readonly user = this.authStore.currentUser;
  protected readonly displayName = this.authStore.displayName;
  protected readonly isSuperAdmin = this.authStore.isSuperAdmin;
  protected readonly isPrincipal = this.authStore.isPrincipalUser;
  protected readonly isDelegated = this.authStore.isDelegated;

  protected readonly properties = this.propertiesStore.count;
  protected readonly supplyPoints = this.metersStore.count;
  protected readonly subusers = this.subusersStore.activeCount;
  protected readonly devices = this.devicesStore.count;
  protected readonly activeDevices = this.devicesStore.activeCount;
  protected readonly installationsOpen = this.installationsStore.openCount;
  protected readonly installersAvailable = this.installersStore.availableCount;
  protected readonly technicians = this.techniciansStore.availableCount;
  protected readonly ticketsOpen = this.ticketsStore.openCount;
  protected readonly visitsScheduled = this.visitsStore.scheduledCount;
  protected readonly subscription = this.subscriptionStore.subscription;
  protected readonly pendingPayments = this.paymentsStore.pendingTotal;
  protected readonly recentTickets = computed(() => this.ticketsStore.items().slice(0, 5));

  protected readonly roleLabel = computed(() => {
    if (this.isSuperAdmin()) return 'SuperAdmin';
    if (this.isDelegated()) return 'Delegated subuser';
    return 'Principal account';
  });

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 19) return 'Good afternoon';
    return 'Good evening';
  });

  protected readonly quickActions = computed<QuickAction[]>(() => {
    if (this.isSuperAdmin()) {
      return [
        {
          link: '/installation/installations',
          label: 'Installation queue',
          description: 'Assign installers and move work forward.',
          icon: 'home_repair_service',
        },
        {
          link: '/installation/devices',
          label: 'Devices',
          description: 'Provision, rotate and revoke credentials.',
          icon: 'developer_board',
        },
        {
          link: '/installation/installers',
          label: 'Installers',
          description: 'Keep the accredited directory current.',
          icon: 'engineering',
        },
        {
          link: '/support/tickets',
          label: 'Support queue',
          description: 'Reply to customers and assign technicians.',
          icon: 'support_agent',
        },
        {
          link: '/support/visits',
          label: 'Visits',
          description: 'Schedule and close on-site work.',
          icon: 'event',
        },
        {
          link: '/support/technicians',
          label: 'Technicians',
          description: 'Manage the support workforce.',
          icon: 'badge',
        },
        {
          link: '/support/guides',
          label: 'Help center',
          description: 'Publish knowledge articles for customers.',
          icon: 'menu_book',
        },
      ];
    }

    if (this.isPrincipal()) {
      return [
        {
          link: '/installation/properties',
          label: 'Properties',
          description: 'Register properties and supply points.',
          icon: 'home_work',
        },
        {
          link: '/installation/meters',
          label: 'Supply points',
          description: 'See every metering point on your account.',
          icon: 'speed',
        },
        {
          link: '/account/subusers',
          label: 'Subusers',
          description: 'Delegate access without sharing your password.',
          icon: 'group',
        },
        {
          link: '/payments/subscription',
          label: 'Subscription',
          description: 'Review your plan and renewal settings.',
          icon: 'workspace_premium',
        },
        {
          link: '/payments/history',
          label: 'Payments',
          description: 'Download invoices and settle pending orders.',
          icon: 'receipt_long',
        },
        {
          link: '/support/tickets',
          label: 'Support',
          description: 'Open a ticket or follow an existing one.',
          icon: 'support_agent',
        },
      ];
    }

    return [
      {
        link: '/installation/meters',
        label: 'My supply points',
        description: 'Only the points granted by the principal account.',
        icon: 'speed',
      },
      {
        link: '/support/tickets',
        label: 'Support',
        description: 'Open a ticket for a granted supply point.',
        icon: 'support_agent',
      },
      {
        link: '/support/visits',
        label: 'Visits',
        description: 'Track scheduled technician visits.',
        icon: 'event',
      },
      {
        link: '/support/guides',
        label: 'Help center',
        description: 'Guides for devices, consumption and accounts.',
        icon: 'menu_book',
      },
      {
        link: '/account/profile',
        label: 'Profile',
        description: 'Keep your contact details up to date.',
        icon: 'person',
      },
    ];
  });

  protected ticketStatusLabel(status: TicketStatus): string {
    return status.replaceAll('_', ' ').toLowerCase();
  }

  protected meterLabel(ticket: Ticket): string {
    const meter = this.metersStore.items().find((item) => item.id === ticket.meterId);
    return meter?.displayName ?? ticket.meterId;
  }

  ngOnInit(): void {
    if (this.isSuperAdmin()) {
      this.installationsStore.load();
      this.devicesStore.load();
      this.installersStore.load();
      this.techniciansStore.load();
    } else if (this.isPrincipal()) {
      this.propertiesStore.load();
      this.metersStore.load();
      this.subusersStore.load();
      this.devicesStore.load();
      this.subscriptionStore.load();
      this.paymentsStore.load();
    } else {
      this.metersStore.load();
    }
    this.ticketsStore.load();
    this.visitsStore.load();
  }
}
