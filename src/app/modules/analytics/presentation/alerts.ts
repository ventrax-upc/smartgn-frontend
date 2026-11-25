import { LanguageService } from '../../../shared/application/language.service';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Alert, AnalyticsApi, Notice } from '../infrastructure/analytics-api';

@Component({
  imports: [TranslatePipe, DatePipe, RouterLink],
  templateUrl: './alerts.html',
  styleUrl: './analytics.css',
})
export class AlertsPage implements OnInit {
  protected readonly lang = inject(LanguageService).lang;
  private readonly api = inject(AnalyticsApi);
  protected readonly mode = signal<'alerts' | 'notices'>('alerts');
  protected readonly alerts = signal<Alert[]>([]);
  protected readonly notices = signal<Notice[]>([]);
  protected readonly selected = signal<Alert | null>(null);
  protected readonly deliveries = signal<Notice[]>([]);
  protected readonly page = signal(0);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  ngOnInit(): void {
    void this.load('alerts', 0);
  }

  protected async load(mode: 'alerts' | 'notices', page: number): Promise<void> {
    if (this.busy() || page < 0) return;
    this.mode.set(mode);
    this.selected.set(null);
    this.error.set('');
    this.alerts.set([]);
    this.notices.set([]);
    this.page.set(page);
    this.busy.set(true);
    try {
      if (mode === 'alerts') this.alerts.set(await firstValueFrom(this.api.alerts(page)));
      else this.notices.set(await firstValueFrom(this.api.notices(page)));
    } catch {
      this.error.set('ui.couldNotLoadTheList');
    } finally {
      this.busy.set(false);
    }
  }

  protected async open(alert: Alert): Promise<void> {
    if (this.busy()) return;
    this.selected.set(alert);
    this.deliveries.set([]);
    this.error.set('');
    this.busy.set(true);
    try {
      this.deliveries.set(await firstValueFrom(this.api.alertNotices(alert.id)));
    } catch {
      this.error.set('ui.couldNotLoadNotificationsForThisAlert');
    } finally {
      this.busy.set(false);
    }
  }

  protected async transition(alert: Alert, action: 'acknowledge' | 'resolve'): Promise<void> {
    if (this.busy()) return;
    this.error.set('');
    this.busy.set(true);
    try {
      const updated = await firstValueFrom(this.api.transition(alert.id, action));
      this.alerts.update((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      this.selected.set(updated);
    } catch (error) {
      const status = (error as { status?: number }).status;
      this.error.set(
        status === 409
          ? 'ui.theAlertStatusChangedRefreshTheList'
          : 'ui.couldNotUpdateTheAlertStatus',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
