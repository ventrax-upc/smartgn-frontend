import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaymentMethod } from '../domain/model/payment-method.entity';
import { PaymentOrder } from '../domain/model/payment-order.entity';
import { Subscription } from '../domain/model/subscription.entity';
import {
  PaymentMethodAssembler,
  PaymentOrderAssembler,
  SubscriptionAssembler,
} from './payment-assembler';
import {
  PaymentMethodInputResource,
  PaymentMethodResource,
  PaymentOrderResource,
  SubscriptionResource,
} from './payment-response';

@Injectable({ providedIn: 'root' })
export class PaymentApi {
  private readonly http = inject(HttpClient);
  private readonly subscriptionAssembler = inject(SubscriptionAssembler);
  private readonly methodAssembler = inject(PaymentMethodAssembler);
  private readonly orderAssembler = inject(PaymentOrderAssembler);
  private readonly base = environment.apiUrl;

  getSubscription(): Observable<Subscription> {
    return this.http.get<SubscriptionResource>(`${this.base}/subscriptions/me`).pipe(
      map((resource) => this.subscriptionAssembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not load the subscription.'))),
    );
  }

  subscribePro(paymentMethodId: string, autoRenew: boolean): Observable<Subscription> {
    return this.http
      .post<SubscriptionResource>(`${this.base}/subscriptions/pro`, {
        paymentMethodId,
        autoRenew,
      })
      .pipe(
        map((resource) => this.subscriptionAssembler.toEntityFromResource(resource)),
        catchError((err) =>
          throwError(() => this.toError(err, 'Could not activate the Pro plan.')),
        ),
      );
  }

  setAutoRenew(autoRenew: boolean): Observable<void> {
    return this.http
      .patch<void>(`${this.base}/subscriptions/me/renewal`, { autoRenew })
      .pipe(
        map(() => undefined),
        catchError((err) =>
          throwError(() => this.toError(err, 'Could not update auto-renewal.')),
        ),
      );
  }

  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethodResource[]>(`${this.base}/payment-methods`).pipe(
      map((resources) => this.methodAssembler.toEntitiesFromResponse(resources)),
      catchError((err) =>
        throwError(() => this.toError(err, 'Could not load payment methods.')),
      ),
    );
  }

  createPaymentMethod(input: PaymentMethodInputResource): Observable<{ id: string; testMode: boolean }> {
    return this.http
      .post<{ id: string; testMode: boolean }>(`${this.base}/payment-methods`, input)
      .pipe(
        catchError((err) =>
          throwError(() => this.toError(err, 'Could not add the payment method.')),
        ),
      );
  }

  setDefaultPaymentMethod(id: string): Observable<void> {
    return this.http.put<void>(`${this.base}/payment-methods/${id}/default`, {}).pipe(
      map(() => undefined),
      catchError((err) =>
        throwError(() => this.toError(err, 'Could not update the default method.')),
      ),
    );
  }

  removePaymentMethod(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/payment-methods/${id}`).pipe(
      map(() => undefined),
      catchError((err) =>
        throwError(() => this.toError(err, 'Could not remove the payment method.')),
      ),
    );
  }

  getHistory(reason?: string, status?: string): Observable<PaymentOrder[]> {
    let params = new HttpParams();
    if (reason) params = params.set('reason', reason);
    if (status) params = params.set('status', status);
    return this.http
      .get<PaymentOrderResource[]>(`${this.base}/payments/history`, { params })
      .pipe(
        map((resources) => this.orderAssembler.toEntitiesFromResponse(resources)),
        catchError((err) =>
          throwError(() => this.toError(err, 'Could not load the payment history.')),
        ),
      );
  }

  payOrder(id: string, paymentMethodId: string): Observable<PaymentOrder> {
    return this.http
      .post<PaymentOrderResource>(`${this.base}/payments/orders/${id}/pay`, { paymentMethodId })
      .pipe(
        map((resource) => this.orderAssembler.toEntityFromResource(resource)),
        catchError((err) => throwError(() => this.toError(err, 'Could not pay the order.'))),
      );
  }

  retryOrder(id: string, paymentMethodId: string): Observable<PaymentOrder> {
    return this.http
      .post<PaymentOrderResource>(`${this.base}/payments/orders/${id}/retry`, { paymentMethodId })
      .pipe(
        map((resource) => this.orderAssembler.toEntityFromResource(resource)),
        catchError((err) => throwError(() => this.toError(err, 'Could not retry the payment.'))),
      );
  }

  downloadDocument(id: string, format: 'pdf' | 'xml' | 'cdr'): Observable<Blob> {
    const params = new HttpParams().set('format', format);
    return this.http
      .get(`${this.base}/billing-documents/${id}/download`, {
        params,
        responseType: 'blob',
      })
      .pipe(
        catchError((err) =>
          throwError(() => this.toError(err, 'Could not download the document.')),
        ),
      );
  }

  private toError(err: unknown, fallback: string): Error {
    const httpErr = err as
      | { error?: { details?: string; message?: string }; message?: string; status?: number }
      | undefined;
    const message = httpErr?.error?.details ?? httpErr?.error?.message ?? httpErr?.message ?? fallback;
    const error = new Error(message) as Error & { status?: number };
    error.status = httpErr?.status;
    return error;
  }
}
