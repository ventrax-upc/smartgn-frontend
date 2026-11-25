import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AnalyticsApi } from './analytics-api';

describe('Analytics API', () => {
  it('encodes each authorized meter and dates for a Pro report', () => {
    TestBed.configureTestingModule({});
    const api = TestBed.inject(AnalyticsApi);
    const http = TestBed.inject(HttpTestingController);
    api.report(['meter-a', 'meter-b'], '2026-11-01T05:00:00Z', '2026-11-25T05:00:00Z').subscribe();
    const request = http.expectOne((r) => r.url === '/api/v1/analytics/reports');
    expect(request.request.params.getAll('meterIds')).toEqual(['meter-a', 'meter-b']);
    expect(request.request.params.get('from')).toBe('2026-11-01T05:00:00Z');
    expect(request.request.params.get('to')).toBe('2026-11-25T05:00:00Z');
    request.flush({ meterRows: [] });
    http.verify();
  });

  it('acknowledges the selected alert through the Gateway', () => {
    TestBed.configureTestingModule({});
    const api = TestBed.inject(AnalyticsApi);
    const http = TestBed.inject(HttpTestingController);
    api.transition(7, 'acknowledge').subscribe();
    const request = http.expectOne('/api/v1/alerts/7/acknowledge');
    expect(request.request.method).toBe('POST');
    request.flush({ id: 7, status: 'ACKNOWLEDGED' });
    http.verify();
  });
});
