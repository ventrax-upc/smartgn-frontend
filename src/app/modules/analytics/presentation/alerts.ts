import { EmptyState, LoadingState } from '../../../shared/presentation/components/view-state';
import { MatIcon } from '@angular/material/icon';
import { LanguageService } from '../../../shared/application/language.service';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { pollWhileVisible } from '../../../shared/application/visible-polling';
import { Alert, AnalyticsApi, Notice } from '../infrastructure/analytics-api';

@Component({
  imports: [EmptyState, LoadingState, MatIcon, TranslatePipe, DatePipe, DecimalPipe],
  templateUrl: './alerts.html',
  styleUrl: './analytics.css',
})
export class AlertsPage implements OnInit {
  protected readonly metricKeys: Record<string, string> = {
    CONSUMPTION: 'ui.consumption',
    PRESSURE: 'ui.pressure',
    GAS_PRESENCE: 'ui.gasPresence',
    VALVE_STATE: 'ui.valve',
  };

  protected readonly lang = inject(LanguageService).lang;
  private readonly api = inject(AnalyticsApi);
  protected readonly mode = signal<'alerts' | 'notices'>('alerts');
  protected readonly alerts = signal<Alert[]>([]);
  protected readonly notices = signal<Notice[]>([]);
  protected readonly selectedNotice = signal<number | null>(null);
  protected readonly selected = signal<Alert | null>(null);
  protected readonly instructionSteps = computed(() =>
    (this.selected()?.instructions ?? '').trim().split(/(?:^|\s+)\d+\.\s+/).filter(Boolean),
  );
  protected readonly deliveries = signal<Notice[]>([]);
  protected readonly page = signal(0);
  protected readonly busy = signal(false);
  protected readonly loadingList = signal(false);
  protected readonly error = signal('');

  constructor() {
    pollWhileVisible(5000, () => void this.load(this.mode(), this.page(), true));
  }

  ngOnInit(): void {
    void this.load('alerts', 0);
  }

  protected async load(mode: 'alerts' | 'notices', page: number, background = false): Promise<void> {
    if (this.busy() || page < 0) return;
    if (!background) {
      this.mode.set(mode);
      this.selectedNotice.set(null);
      this.selected.set(null);
      this.error.set('');
      this.alerts.set([]);
      this.notices.set([]);
      this.page.set(page);
    }
    this.loadingList.set(!background);
    this.busy.set(true);
    try {
      if (mode === 'alerts') {
        const alerts = await firstValueFrom(this.api.alerts(page));
        this.alerts.set(alerts);
        const selectedId = this.selected()?.id;
        if (selectedId != null) this.selected.set(alerts.find((alert) => alert.id === selectedId) ?? null);
      } else {
        const notices = await firstValueFrom(this.api.notices(page));
        this.notices.set(notices);
        if (!notices.some((notice) => notice.id === this.selectedNotice())) this.selectedNotice.set(null);
      }
      if (['ui.couldNotLoadTheList', 'ui.theAlertStatusChangedRefreshTheList'].includes(this.error())) {
        this.error.set('');
      }
    } catch {
      if (!background || (!this.alerts().length && !this.notices().length)) {
        this.error.set('ui.couldNotLoadTheList');
      }
    } finally {
      this.loadingList.set(false);
      this.busy.set(false);
    }
  }

  protected async open(alert: Alert): Promise<void> {
    if (this.busy()) return;
    if (this.selected()?.id === alert.id) {
      this.selected.set(null);
      this.deliveries.set([]);
      this.error.set('');
      return;
    }
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
