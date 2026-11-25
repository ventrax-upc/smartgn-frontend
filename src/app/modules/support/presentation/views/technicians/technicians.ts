import { FormDialog } from '../../../../../shared/presentation/components/form-dialog';
import { EmptyState, LoadingState } from '../../../../../shared/presentation/components/view-state';
import { pollWhileVisible } from '../../../../../shared/application/visible-polling';
import { TranslatePipe } from '@ngx-translate/core';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { TechniciansStore } from '../../../application/technicians.store';

@Component({
  selector: 'app-technicians',
  imports: [FormDialog, EmptyState, LoadingState, TranslatePipe, ReactiveFormsModule, MatIcon],
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

  constructor() {
    pollWhileVisible(null, () => this.reload());
  }

  ngOnInit(): void {
    this.store.load();
  }

  private reload(): void {
    if (this.loading() || this.showForm() || this.saving()) return;
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
          this.success.set('ui.technicianRegisteredAndAvailableForAssignments');
        },
      },
    );
  }
}
