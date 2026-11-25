import { SmartgnSelect } from '../../../../../shared/presentation/components/smartgn-select';
import { EmptyState, LoadingState } from '../../../../../shared/presentation/components/view-state';
import { MatSelectModule } from '@angular/material/select';
import { pollWhileVisible } from '../../../../../shared/application/visible-polling';
import { LanguageService } from '../../../../../shared/application/language.service';
import { TranslatePipe } from '@ngx-translate/core';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, formatDate } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { PaymentsStore } from '../../../application/payments.store';
import { PaymentMethodsStore } from '../../../application/payment-methods.store';
import { PaymentOrder } from '../../../domain/model/payment-order.entity';

@Component({
  selector: 'app-payments',
  imports: [SmartgnSelect, EmptyState, LoadingState, MatSelectModule, TranslatePipe, CurrencyPipe, DatePipe, RouterLink, MatIcon],
  templateUrl: './payments.html',
  styleUrl: './payments.css',
})
export class PaymentsPage implements OnInit {
  protected readonly lang = inject(LanguageService).lang;
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

  constructor() {
    pollWhileVisible(10000, () => this.reload());
  }

  ngOnInit(): void {
    this.store.load();
    this.methodsStore.load();
  }

  private reload(): void {
    if (this.loading() || this.saving() || this.methodsStore.loading()) return;
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
      onSuccess: () => this.success.set('ui.paymentRequestedRefreshToCheckConfirmation'),
    };
    if (order.status === 'FAILED') {
      this.store.retry(order, methodId, callbacks);
    } else {
      this.store.pay(order, methodId, callbacks);
    }
  }

  protected download(order: PaymentOrder, documentId: string, title: string | null, index: number): void {
    const date = formatDate(order.createdAt, 'yyyy-MM-dd', 'en-US');
    const documentSuffix = order.documents.length > 1 ? ` - ${index + 1}` : '';
    this.store.download(documentId, `${title?.trim() || 'Order'} - ${date}${documentSuffix}`);
  }

  protected reasonLabel(order: PaymentOrder): string {
    if (order.reason === 'PRO') return 'ui.proSubscription';
    if (order.reason === 'TECHNICAL_VISIT') return 'ui.technicalVisit';
    return 'ui.installation';
  }
}
