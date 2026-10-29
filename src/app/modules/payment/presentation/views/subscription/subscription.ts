import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { SubscriptionStore } from '../../../application/subscription.store';
import { PaymentMethodsStore } from '../../../application/payment-methods.store';

@Component({
  selector: 'app-subscription',
  imports: [CurrencyPipe, DatePipe, RouterLink, MatIcon],
  templateUrl: './subscription.html',
  styleUrl: './subscription.css',
})
export class SubscriptionPage implements OnInit {
  private readonly store = inject(SubscriptionStore);
  private readonly methodsStore = inject(PaymentMethodsStore);

  protected readonly subscription = this.store.subscription;
  protected readonly loading = this.store.loading;
  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;
  protected readonly methods = this.methodsStore.items;
  protected readonly defaultMethod = this.methodsStore.defaultMethod;
  protected readonly selectedMethod = signal('');
  protected readonly autoRenew = signal(true);
  protected readonly success = signal<string | null>(null);

  ngOnInit(): void {
    this.store.load();
    this.methodsStore.load();
  }

  protected reload(): void {
    this.store.load();
    this.methodsStore.load();
  }

  protected chooseMethod(event: Event): void {
    this.selectedMethod.set((event.target as HTMLSelectElement).value);
  }

  protected activate(): void {
    const methodId = this.selectedMethod() || this.defaultMethod()?.id || '';
    if (!methodId) {
      this.success.set(null);
      return;
    }
    this.store.subscribePro(methodId, this.autoRenew(), {
      onSuccess: () => this.success.set('Pro plan activated. Your period starts today.'),
    });
  }

  protected toggleAutoRenew(event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    this.autoRenew.set(enabled);
    if (!this.subscription()?.proActive) return;
    this.store.setAutoRenew(enabled, {
      onSuccess: () =>
        this.success.set(enabled ? 'Auto-renewal enabled.' : 'Auto-renewal disabled.'),
    });
  }
}
