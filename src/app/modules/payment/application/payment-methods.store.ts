import { Injectable, computed, inject, signal } from '@angular/core';
import { PaymentMethod } from '../domain/model/payment-method.entity';
import { PaymentApi } from '../infrastructure/payment-api';
import { PaymentMethodInputResource } from '../infrastructure/payment-response';

@Injectable({ providedIn: 'root' })
export class PaymentMethodsStore {
  private readonly api = inject(PaymentApi);

  private readonly itemsSignal = signal<PaymentMethod[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly savingSignal = signal(false);
  readonly saving = this.savingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly defaultMethod = computed(
    () => this.itemsSignal().find((method) => method.isDefault) ?? this.itemsSignal()[0] ?? null,
  );

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getPaymentMethods().subscribe({
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

  create(
    input: PaymentMethodInputResource,
    callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.createPaymentMethod(input).subscribe({
      next: () => {
        this.savingSignal.set(false);
        this.load();
        callbacks?.onSuccess?.();
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  setDefault(
    method: PaymentMethod,
    callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.setDefaultPaymentMethod(method.id).subscribe({
      next: () => {
        this.itemsSignal.update((items) =>
          items.map(
            (item) =>
              new PaymentMethod({
                id: item.id,
                brand: item.brand,
                lastFour: item.lastFour,
                isDefault: item.id === method.id,
                active: item.active,
              }),
          ),
        );
        this.load();
        this.savingSignal.set(false);
        callbacks?.onSuccess?.();
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  remove(
    method: PaymentMethod,
    callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.removePaymentMethod(method.id).subscribe({
      next: () => {
        this.itemsSignal.update((items) => items.filter((item) => item.id !== method.id));
        this.savingSignal.set(false);
        callbacks?.onSuccess?.();
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  private messageFrom(err: unknown): string {
    return err instanceof Error && err.message
      ? err.message
      : 'Could not complete the operation.';
  }
}
