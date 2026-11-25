import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PaymentApi } from './payment-api';

describe('Billing order responses', () => {
  it('enables retry for a declined payment and accepts an operation receipt', () => {
    TestBed.configureTestingModule({});
    const api = TestBed.inject(PaymentApi);
    const http = TestBed.inject(HttpTestingController);
    let retryable = false;
    api.getHistory().subscribe(([order]) => (retryable = order.canPay && order.status === 'FAILED'));
    http.expectOne('/api/v1/payments/history').flush([{ id: 'order-1', status: 'DECLINED' }]);
    expect(retryable).toBe(true);

    let done = false;
    api.retryOrder('order-1', 'method-1').subscribe(() => (done = true));
    const request = http.expectOne('/api/v1/payments/orders/order-1/retry');
    expect(request.request.headers.has('Idempotency-Key')).toBe(true);
    expect(request.request.body).toEqual({ paymentMethodId: 'method-1' });
    request.flush({ operationId: 'operation-1', status: 'PENDING' });
    expect(done).toBe(true);
    http.verify();
  });
});
