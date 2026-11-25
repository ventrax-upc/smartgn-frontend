import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { describe, expect, it } from 'vitest';
import { AuthStore } from '../../iam/application/auth.store';
import { DevicesStore } from './devices.store';

describe('DevicesStore', () => {
  it('queries devices only for meters with an assigned function when delegated', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: { isSuperAdmin: () => false, isDelegated: () => true } },
      ],
    });
    const store = TestBed.inject(DevicesStore);
    const http = TestBed.inject(HttpTestingController);

    store.load('ACTIVE');
    http.expectOne('/api/v1/meters').flush([
      { meter: { id: 'allowed-meter' }, permissions: ['VIEW_HISTORY'] },
      { meter: { id: 'unassigned-meter' }, permissions: [] },
    ]);

    const request = http.expectOne(
      '/api/v1/devices?pointId=allowed-meter&function=VIEW_HISTORY&status=ACTIVE',
    );
    expect(request.request.method).toBe('GET');
    request.flush([{ device: { id: 'device-1', serialNumber: 'SGN-01', status: 'ACTIVE' } }]);
    expect(store.items()[0]?.id).toBe('device-1');
    expect(store.activeCount()).toBe(1);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    http.verify();
  });
});
