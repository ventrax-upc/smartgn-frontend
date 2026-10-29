import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MetersStore } from '../../../application/meters.store';

@Component({
  selector: 'app-meters',
  imports: [RouterLink, MatIcon],
  templateUrl: './meters.html',
  styleUrl: './meters.css',
})
export class MetersPage implements OnInit {
  private readonly store = inject(MetersStore);

  protected readonly items = this.store.items;
  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;
  protected readonly count = this.store.count;
  protected readonly propertyCount = this.store.propertyCount;

  protected readonly permissionLabels: Record<string, string> = {
    VIEW_CONSUMPTION: 'Consumption',
    VIEW_HISTORY: 'History',
    VIEW_ALERTS: 'Alerts',
    USE_REPORTS: 'Reports',
    USE_TICKETS: 'Tickets',
    USE_VISITS: 'Visits',
  };

  ngOnInit(): void {
    this.store.load();
  }

  protected reload(): void {
    this.store.load();
  }
}
