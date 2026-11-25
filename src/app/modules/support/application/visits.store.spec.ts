import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Visit } from '../domain/model/visit.entity';
import { VisitsStore } from './visits.store';

describe('VisitsStore', () => {
  it('schedules an assigned visit with its window before starting it', () => {
    TestBed.configureTestingModule({});
    const store = TestBed.inject(VisitsStore);
    const http = TestBed.inject(HttpTestingController);
    const window = {
      requestedWindowStart: '2026-11-25T15:00:00Z',
      requestedWindowEnd: '2026-11-25T17:00:00Z',
    };
    const visit = new Visit({ id: 'visit-1', ticketId: 'ticket-1', status: 'ASSIGNED', ...window });
    const response = { visitId: visit.id, ticketId: visit.ticketId, completedAt: null, ...window };

    store.advanceVisit(visit);
    const schedule = http.expectOne('/api/v1/support/visits/visit-1/schedule');
    expect(schedule.request.method).toBe('POST');
    expect(schedule.request.body).toEqual(window);
    schedule.flush({ ...response, status: 'SCHEDULED' });
    expect(store.items()[0].status).toBe('SCHEDULED');

    store.advanceVisit(store.items()[0]);
    const start = http.expectOne('/api/v1/support/visits/visit-1/start');
    expect(start.request.method).toBe('POST');
    start.flush({ ...response, status: 'IN_PROGRESS' });
    expect(store.items()[0].status).toBe('IN_PROGRESS');
    expect(store.saving()).toBe(false);
    http.verify();
  });
});
