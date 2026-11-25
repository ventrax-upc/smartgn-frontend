import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from '../../../../../shared/presentation/components/confirm-dialog/confirm-dialog';
import { FormDialog } from '../../../../../shared/presentation/components/form-dialog';
import { SmartgnSelect } from '../../../../../shared/presentation/components/smartgn-select';
import { EmptyState, LoadingState } from '../../../../../shared/presentation/components/view-state';
import { MatSelectModule } from '@angular/material/select';
import { pollWhileVisible } from '../../../../../shared/application/visible-polling';
import { LanguageService } from '../../../../../shared/application/language.service';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SubscriptionStore } from '../../../application/subscription.store';
import { PaymentMethodsStore } from '../../../application/payment-methods.store';

@Component({
  selector: 'app-subscription',
  imports: [FormDialog, SmartgnSelect, EmptyState, LoadingState, MatSelectModule, CurrencyPipe, DatePipe, RouterLink, MatIcon, TranslatePipe],
  templateUrl: './subscription.html',
  styleUrl: './subscription.css',
})
export class SubscriptionPage implements OnInit {
  protected readonly lang = inject(LanguageService).lang;
  private readonly dialog = inject(MatDialog);
  private readonly store = inject(SubscriptionStore);
  private readonly methodsStore = inject(PaymentMethodsStore);
  private readonly translate = inject(TranslateService);

  protected readonly subscription = this.store.subscription;
  protected readonly loading = this.store.loading;
  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;
  protected readonly methods = this.methodsStore.items;
  protected readonly defaultMethod = this.methodsStore.defaultMethod;
  protected readonly showActivationForm = signal(false);
  protected readonly selectedMethod = signal('');
  protected readonly autoRenew = signal(true);
  protected readonly success = signal<string | null>(null);

  constructor() {
    pollWhileVisible(30000, () => this.reload());
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

  protected activate(): void {
    const methodId = this.selectedMethod() || this.defaultMethod()?.id || '';
    if (!methodId) {
      this.success.set(null);
      return;
    }
    this.store.subscribePro(methodId, this.autoRenew(), {
      onSuccess: () => {
        this.showActivationForm.set(false);
        this.success.set(this.translate.instant('subscription.messages.activatedSuccess'));
      },
    });
  }

  protected toggleAutoRenew(event: Event): void {
    this.autoRenew.set((event.target as HTMLInputElement).checked);
  }

  protected cancelRenewal(): void {
    this.dialog.open(ConfirmDialog, {
      data: {
        titleKey: 'subscription.cancelRenewal',
        messageKey: 'subscription.cancelRenewalConfirmation',
        confirmKey: 'subscription.cancelRenewal',
        iconName: 'event_busy',
      },
    }).afterClosed().subscribe((confirmed) => {
      if (confirmed) this.updateRenewal(false);
    });
  }

  protected updateRenewal(enabled: boolean): void {
    const current = this.subscription();
    if (!current?.proActive || current.autoRenew === enabled || this.saving()) return;
    this.success.set(null);
    this.store.setAutoRenew(enabled, {
      onSuccess: () =>
        this.success.set(
          this.translate.instant(
            enabled
              ? 'subscription.messages.autoRenewEnabled'
              : 'subscription.messages.autoRenewDisabled',
          ),
        ),
    });
  }
}
