import { Injectable, computed, inject, signal } from '@angular/core';
import { PaymentOrder } from '../domain/model/payment-order.entity';
import { PaymentApi } from '../infrastructure/payment-api';

@Injectable({ providedIn: 'root' })
export class PaymentsStore {
  private readonly api = inject(PaymentApi);

  private readonly itemsSignal = signal<PaymentOrder[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly savingSignal = signal(false);
  readonly saving = this.savingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly pendingTotal = computed(() =>
    this.itemsSignal()
      .filter((order) => order.status === 'PENDING' || order.status === 'FAILED')
      .reduce((sum, order) => sum + order.amount, 0),
  );

  readonly paidTotal = computed(() =>
    this.itemsSignal()
      .filter((order) => order.status === 'PAID')
      .reduce((sum, order) => sum + order.amount, 0),
  );

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getHistory().subscribe({
      next: (items) => {
        this.itemsSignal.set(items);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.messageFrom(err));
        this.loadingSignal.set(false);
      },
    });
  }

  pay(
    order: PaymentOrder,
    paymentMethodId: string,
    callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.payOrder(order.id, paymentMethodId).subscribe({
      next: (updated) => {
        this.replace(updated);
        this.savingSignal.set(false);
        callbacks?.onSuccess?.();
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  retry(
    order: PaymentOrder,
    paymentMethodId: string,
    callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.retryOrder(order.id, paymentMethodId).subscribe({
      next: (updated) => {
        this.replace(updated);
        this.savingSignal.set(false);
        callbacks?.onSuccess?.();
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  download(documentId: string, format: 'pdf' | 'xml' | 'cdr', number: string): void {
    this.api.downloadDocument(documentId, format).subscribe({
      next: (blob) => {
        const extension = format === 'cdr' ? 'zip' : format;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${number}.${extension}`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => this.errorSignal.set(this.messageFrom(err)),
    });
  }

  private replace(updated: PaymentOrder): void {
    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  private messageFrom(err: unknown): string {
    return err instanceof Error && err.message
      ? err.message
      : 'Could not complete the operation.';
  }
}
