import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { PaymentMethodsStore } from '../../../application/payment-methods.store';
import { PaymentMethod } from '../../../domain/model/payment-method.entity';
import { ConfirmDialog } from '../../../../../shared/presentation/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-payment-methods',
  imports: [ReactiveFormsModule, MatIcon],
  templateUrl: './payment-methods.html',
  styleUrl: './payment-methods.css',
})
export class PaymentMethodsPage implements OnInit {
  private readonly store = inject(PaymentMethodsStore);
  private readonly dialog = inject(MatDialog);

  protected readonly items = this.store.items;
  protected readonly loading = this.store.loading;
  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;
  protected readonly showForm = signal(false);
  protected readonly success = signal<string | null>(null);
  protected readonly brands = ['VISA', 'MASTERCARD', 'AMEX', 'DINERS'];

  protected readonly form = new FormGroup({
    brand: new FormControl('VISA', [Validators.required]),
    lastFour: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d{4}$/),
    ]),
    providerToken: new FormControl(''),
  });

  ngOnInit(): void {
    this.store.load();
  }

  protected reload(): void {
    this.store.load();
  }

  protected startCreate(): void {
    this.form.reset({ brand: 'VISA', lastFour: '', providerToken: '' });
    this.showForm.set(true);
    this.success.set(null);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.store.create(
      {
        brand: value.brand ?? 'VISA',
        lastFour: value.lastFour ?? '',
        providerToken: value.providerToken?.trim() || undefined,
      },
      {
        onSuccess: () => {
          this.showForm.set(false);
          this.success.set('Payment method added to your account.');
        },
      },
    );
  }

  protected setDefault(method: PaymentMethod): void {
    if (method.isDefault) return;
    this.store.setDefault(method, {
      onSuccess: () => this.success.set('Default payment method updated.'),
    });
  }

  protected remove(method: PaymentMethod): void {
    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        titleKey: 'Remove payment method',
        messageKey: `Remove ${method.label}? Pending charges cannot use this card afterwards.`,
        confirmKey: 'Remove card',
        iconName: 'credit_card_off',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.remove(method, {
          onSuccess: () => this.success.set('Payment method removed.'),
        });
      }
    });
  }
}
