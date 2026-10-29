import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { PaymentsStore } from '../../../application/payments.store';
import { PaymentMethodsStore } from '../../../application/payment-methods.store';
import { PaymentOrder } from '../../../domain/model/payment-order.entity';

@Component({
  selector: 'app-payments',
  imports: [CurrencyPipe, DatePipe, RouterLink, MatIcon],
  templateUrl: './payments.html',
  styleUrl: './payments.css',
})
export class PaymentsPage implements OnInit {
  private readonly store = inject(PaymentsStore);
  private readonly methodsStore = inject(PaymentMethodsStore);

  protected readonly items = this.store.items;
  protected readonly loading = this.store.loading;
  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;
  protected readonly pendingTotal = this.store.pendingTotal;
  protected readonly paidTotal = this.store.paidTotal;
  protected readonly methods = this.methodsStore.items;
  protected readonly defaultMethod = this.methodsStore.defaultMethod;
  protected readonly selection = signal<Record<string, string>>({});
  protected readonly success = signal<string | null>(null);

  ngOnInit(): void {
    this.store.load();
    this.methodsStore.load();
  }

  protected reload(): void {
    this.store.load();
    this.methodsStore.load();
  }

  protected selectMethod(order: PaymentOrder, value: string): void {
    this.selection.update((current) => ({ ...current, [order.id]: value }));
  }

  protected selectedMethod(order: PaymentOrder): string {
    return this.selection()[order.id] ?? this.defaultMethod()?.id ?? '';
  }

  protected pay(order: PaymentOrder): void {
    const methodId = this.selectedMethod(order);
    if (!methodId) return;
    const callbacks = {
      onSuccess: () => this.success.set(`Payment ${order.id} confirmed.`),
    };
    if (order.status === 'FAILED') {
      this.store.retry(order, methodId, callbacks);
    } else {
      this.store.pay(order, methodId, callbacks);
    }
  }

  protected download(order: PaymentOrder, documentId: string, format: 'pdf' | 'xml' | 'cdr'): void {
    const document = order.documents.find((item) => item.id === documentId);
    if (!document) return;
    this.store.download(document.id, format, document.number);
  }

  protected reasonLabel(order: PaymentOrder): string {
    if (order.reason === 'PRO') return 'Pro subscription';
    if (order.reason === 'TECHNICAL_VISIT') return 'Technical visit';
    return 'Installation';
  }
}
