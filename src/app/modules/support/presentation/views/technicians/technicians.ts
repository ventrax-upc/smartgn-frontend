import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { TechniciansStore } from '../../../application/technicians.store';

@Component({
  selector: 'app-technicians',
  imports: [ReactiveFormsModule, MatIcon],
  templateUrl: './technicians.html',
  styleUrl: './technicians.css',
})
export class TechniciansPage implements OnInit {
  private readonly store = inject(TechniciansStore);

  protected readonly items = this.store.items;
  protected readonly loading = this.store.loading;
  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;
  protected readonly count = this.store.count;
  protected readonly availableCount = this.store.availableCount;
  protected readonly showForm = signal(false);
  protected readonly success = signal<string | null>(null);

  protected readonly form = new FormGroup({
    fullName: new FormControl('', [Validators.required, Validators.maxLength(120)]),
    accreditationCode: new FormControl('', [Validators.required, Validators.maxLength(60)]),
    phone: new FormControl('', [Validators.required, Validators.maxLength(30)]),
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  ngOnInit(): void {
    this.store.load();
  }

  protected reload(): void {
    this.store.load();
  }

  protected startCreate(): void {
    this.form.reset({ fullName: '', accreditationCode: '', phone: '', email: '' });
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
        fullName: value.fullName?.trim() ?? '',
        accreditationCode: value.accreditationCode?.trim() ?? '',
        phone: value.phone?.trim() ?? '',
        email: value.email?.trim() ?? '',
      },
      {
        onSuccess: () => {
          this.showForm.set(false);
          this.success.set('Technician registered and available for assignments.');
        },
      },
    );
  }
}
