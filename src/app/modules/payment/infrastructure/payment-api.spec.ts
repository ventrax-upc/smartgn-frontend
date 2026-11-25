import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PaymentApi } from './payment-api';

describe('PaymentApi', () => {
  it('sends an idempotency key for Pro and reads the current subscription after the order', () => {
    TestBed.configureTestingModule({});
    const api = TestBed.inject(PaymentApi);
    const http = TestBed.inject(HttpTestingController);
    let active: boolean | undefined;

    api.subscribePro('method-1', false).subscribe((subscription) => (active = subscription.proActive));
    const order = http.expectOne('/api/v1/subscriptions/pro');
    expect(order.request.method).toBe('POST');
    expect(order.request.headers.get('Idempotency-Key')).toMatch(/^[a-f0-9-]{36}$/);
    order.flush({ id: 'order-1', status: 'PENDING' });
    http.expectOne('/api/v1/subscriptions/me').flush({ accountId: 'account-1', proActive: false });
    expect(active).toBe(false);
    http.verify();
  });
});
