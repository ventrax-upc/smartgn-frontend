import { LanguageService } from '../../../shared/application/language.service';
import { TranslatePipe } from '@ngx-translate/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, interval } from 'rxjs';
import { MetersApi } from '../../installation/infrastructure/meters-api';
import { Meter } from '../../installation/domain/model/meter.entity';
import { AnalyticsApi, Consumption, Reading, Report } from '../infrastructure/analytics-api';

function localDay(date: Date): string {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-');
}

function dates(from: string, to: string): [string, string] {
  const start = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start > end) {
    throw new Error('ui.selectAValidDateRange');
  }
  end.setDate(end.getDate() + 1);
  const now = new Date();
  if (start >= now) throw new Error('ui.theDateRangeMustStartBeforeThe');
  const effectiveEnd = end > now ? now : end;
  return [start.toISOString(), effectiveEnd.toISOString()];
}

@Component({
  imports: [TranslatePipe, FormsModule, CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './monitoring.html',
  styleUrl: './analytics.css',
})
export class MonitoringPage implements OnInit {
  protected readonly lang = inject(LanguageService).lang;
  private readonly api = inject(AnalyticsApi);
  private readonly metersApi = inject(MetersApi);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly meters = signal<Meter[]>([]);
  protected readonly mode = signal<'live' | 'history' | 'pro'>('live');
  protected readonly eligible = computed(() =>
    this.meters().filter((meter) =>
      meter.has(
        { live: 'VIEW_CONSUMPTION', history: 'VIEW_HISTORY', pro: 'USE_REPORTS' }[this.mode()],
      ),
    ),
  );
  protected readonly reading = signal<Reading | null>(null);
  protected readonly history = signal<Consumption | null>(null);
  protected readonly report = signal<Report | null>(null);
  protected readonly comparison = signal<Report | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected ids: string[] = [];
  protected from = localDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  protected to = localDay(new Date());
  protected compare = false;
  protected compareFrom = '';
  protected compareTo = '';

  async ngOnInit(): Promise<void> {
    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.mode() === 'live' && this.ids.length) void this.query();
      });
    this.busy.set(true);
    try {
      this.meters.set(await firstValueFrom(this.metersApi.getAll()));
      this.select('live');
    } catch {
      this.error.set('ui.couldNotLoadMeters');
    } finally {
      this.busy.set(false);
    }
    if (this.ids.length) await this.query();
  }

  protected select(mode: 'live' | 'history' | 'pro'): void {
    this.mode.set(mode);
    this.ids = this.eligible()
      .slice(0, 1)
      .map((meter) => meter.id);
    this.clear();
    this.error.set('');
  }

  protected toggle(id: string, selected: boolean): void {
    this.ids = selected ? [...this.ids, id] : this.ids.filter((value) => value !== id);
    this.clear();
  }

  protected async query(): Promise<void> {
    if (!this.ids.length || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      if (this.mode() === 'live') {
        this.reading.set(await firstValueFrom(this.api.live(this.ids[0])));
      } else {
        this.clear();
        const period = dates(this.from, this.to);
        if (this.mode() === 'history') {
          this.history.set(await firstValueFrom(this.api.consumption(this.ids, ...period)));
        } else {
          const previous = this.compare ? dates(this.compareFrom, this.compareTo) : null;
          const [report, comparison] = await Promise.all([
            firstValueFrom(this.api.report(this.ids, ...period)),
            previous ? firstValueFrom(this.api.report(this.ids, ...previous)) : null,
          ]);
          this.report.set(report);
          this.comparison.set(comparison);
        }
      }
    } catch (error) {
      this.clear();
      const status = (error as { status?: number }).status;
      this.error.set(
        status === 403
          ? 'ui.thisQueryRequiresPermissionForEachMeter'
          : error instanceof Error
            ? error.message
            : 'ui.couldNotCompleteTheQueryTryAgain',
      );
    } finally {
      this.busy.set(false);
    }
  }

  protected comparedVolume(id: string): number | null {
    return this.comparison()?.meterRows.find((row) => row.meterId === id)?.volumeM3 ?? null;
  }

  protected label(id: string): string {
    return this.meters().find((meter) => meter.id === id)?.displayName ?? id;
  }

  protected clear(): void {
    this.reading.set(null);
    this.history.set(null);
    this.report.set(null);
    this.comparison.set(null);
  }
}
