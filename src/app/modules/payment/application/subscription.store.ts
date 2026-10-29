import { Injectable, inject, signal } from '@angular/core';
import { Subscription } from '../domain/model/subscription.entity';
import { PaymentApi } from '../infrastructure/payment-api';

@Injectable({ providedIn: 'root' })
export class SubscriptionStore {
  private readonly api = inject(PaymentApi);

  private readonly subscriptionSignal = signal<Subscription | null>(null);
  readonly subscription = this.subscriptionSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly savingSignal = signal(false);
  readonly saving = this.savingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getSubscription().subscribe({
      next: (subscription) => {
        this.subscriptionSignal.set(subscription);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.messageFrom(err));
        this.loadingSignal.set(false);
      },
    });
  }

  subscribePro(
    paymentMethodId: string,
    autoRenew: boolean,
    callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.subscribePro(paymentMethodId, autoRenew).subscribe({
      next: (subscription) => {
        this.subscriptionSignal.set(subscription);
        this.savingSignal.set(false);
        callbacks?.onSuccess?.();
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  setAutoRenew(
    autoRenew: boolean,
    callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.setAutoRenew(autoRenew).subscribe({
      next: () => {
        this.subscriptionSignal.update((subscription) =>
          subscription
            ? new Subscription({
                accountId: subscription.accountId,
                proActive: subscription.proActive,
                plan: subscription.plan,
                periodStartsAt: subscription.periodStartsAt,
                periodEndsAt: subscription.periodEndsAt,
                installationCompleted: subscription.installationCompleted,
                autoRenew,
                technicalCoveragePercent: subscription.technicalCoveragePercent,
                monthlyProPrice: subscription.monthlyProPrice,
                currency: subscription.currency,
                technicalBasePriceReference: subscription.technicalBasePriceReference,
              })
            : subscription,
        );
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
