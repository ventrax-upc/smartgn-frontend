import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';

export interface Reading {
  measuredAt: string | null;
  totalVolumeM3: number | null;
  pressureKpa: number | null;
  gasDetected: boolean | null;
  valveOpen: boolean | null;
  freshness: string;
}

export interface ConsumptionRow {
  meterId: string;
  volumeM3: number;
  estimatedCost: number;
}

export interface Consumption {
  currency: string;
  totalVolumeM3: number;
  totalEstimatedCost: number;
  meters: (ConsumptionRow & {
    monthlyEstimateM3: number | null;
    monthlyEstimateCost: number | null;
    stale: boolean;
  })[];
}

export interface Report {
  currency: string;
  totalVolumeM3: number;
  totalEstimatedCost: number;
  meterRows: ConsumptionRow[];
}

export interface Alert {
  id: number;
  supplyPointId: string;
  ruleName: string;
  metric: string;
  threshold: number;
  measuredValue: number;
  condition: string;
  severity: string;
  severityLabel: string;
  status: string;
  statusLabel: string;
  instructions: string;
  createdAt: string;
}

export interface Notice {
  id: number;
  subject: string;
  body: string;
  channel: string;
  status: string;
  statusLabel: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  live(meterId: string) {
    return this.http.get<Reading>(this.base + '/analytics/live', { params: { meterId } });
  }

  consumption(meterIds: string[], from: string, to: string) {
    return this.http.get<Consumption>(this.base + '/analytics/consumption', {
      params: this.period(meterIds, from, to),
    });
  }

  report(meterIds: string[], from: string, to: string) {
    return this.http.get<Report>(this.base + '/analytics/reports', {
      params: this.period(meterIds, from, to),
    });
  }

  alerts(page: number) {
    return this.http.get<Alert[]>(this.base + '/alerts', { params: { page, size: 20 } });
  }

  notices(page: number) {
    return this.http.get<Notice[]>(this.base + '/notifications', { params: { page, size: 20 } });
  }

  alertNotices(id: number) {
    return this.http.get<Notice[]>(this.base + '/alerts/' + id + '/notifications');
  }

  transition(id: number, action: 'acknowledge' | 'resolve') {
    return this.http.post<Alert>(this.base + '/alerts/' + id + '/' + action, {});
  }

  private period(meterIds: string[], from: string, to: string): HttpParams {
    return new HttpParams({ fromObject: { meterIds, from, to } });
  }
}
