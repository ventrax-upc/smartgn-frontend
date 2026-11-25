import { Component, OnInit, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../../../../shared/application/language.service';
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

interface StatusSlice {
  status: TicketStatus;
  labelKey: string;
  count: number;
  color: string;
}

const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: '#c2410c',
  WRITTEN_SUPPORT: '#9273b6',
  VISIT_REQUESTED: '#3b6fb6',
  RESOLVED: '#2f855a',
  CLOSED: '#64748b',
};

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink, MatIcon, TranslatePipe],
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
  protected readonly lang = inject(LanguageService).lang;

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
  protected readonly recentTickets = computed(() => this.ticketsStore.items().slice(0, 5));

  protected readonly roleKey = computed(() => {
    if (this.isSuperAdmin()) return 'home.role.admin';
    if (this.isDelegated()) return 'home.role.delegated';
    return 'home.role.principal';
  });

  protected readonly greetingKey = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'home.greeting.morning';
    if (hour < 19) return 'home.greeting.afternoon';
    return 'home.greeting.evening';
  });

  protected readonly todayLabel = computed(() => {
    const label = new Date().toLocaleDateString(this.lang(), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  });

  protected readonly statusSlices = computed<StatusSlice[]>(() => {
    const counts: Record<TicketStatus, number> = {
      OPEN: 0,
      WRITTEN_SUPPORT: 0,
      VISIT_REQUESTED: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };
    for (const ticket of this.ticketsStore.items()) counts[ticket.status] += 1;
    return (Object.keys(counts) as TicketStatus[]).map((status) => ({
      status,
      labelKey: this.ticketStatusKey(status),
      count: counts[status],
      color: STATUS_COLORS[status],
    }));
  });

  protected readonly ticketTotal = computed(() =>
    this.statusSlices().reduce((sum, slice) => sum + slice.count, 0),
  );

  protected readonly donutBackground = computed(() => {
    const total = this.ticketTotal();
    if (total === 0) return 'conic-gradient(var(--smartgn-border-strong) 0 100%)';
    let acc = 0;
    const stops = this.statusSlices()
      .filter((slice) => slice.count > 0)
      .map((slice) => {
        const from = (acc / total) * 100;
        acc += slice.count;
        const to = (acc / total) * 100;
        return `${slice.color} ${from}% ${to}%`;
      });
    return `conic-gradient(${stops.join(', ')})`;
  });

  protected ticketStatusKey(status: TicketStatus): string {
    return `home.status.${status}`;
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
    } else {
      this.metersStore.load();
    }
    this.ticketsStore.load();
    this.visitsStore.load();
  }
}
