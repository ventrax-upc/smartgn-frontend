import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { SubusersStore } from '../../../application/subusers.store';
import { MeterPermission } from '../../../domain/model/subuser.entity';
import { MetersStore } from '../../../../installation/application/meters.store';

@Component({
  selector: 'app-subusers',
  imports: [ReactiveFormsModule, MatIcon],
  templateUrl: './subusers.html',
  styleUrl: './subusers.css',
})
export class SubusersPage implements OnInit {
  private readonly store = inject(SubusersStore);
  private readonly metersStore = inject(MetersStore);

  protected readonly items = this.store.items;
  protected readonly loading = this.store.loading;
  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;
  protected readonly count = this.store.count;
  protected readonly activeCount = this.store.activeCount;
  protected readonly pendingCount = this.store.pendingCount;
  protected readonly meters = this.metersStore.items;

  protected readonly success = signal<string | null>(null);
  protected readonly activationLink = signal<string | null>(null);

  protected readonly selectedSubuserId = signal('');
  protected readonly selectedMeterId = signal('');
  protected readonly selectedPermissions = signal<MeterPermission[]>([]);

  protected readonly permissions: Array<{ value: MeterPermission; label: string }> = [
    { value: 'VIEW_CONSUMPTION', label: 'View consumption' },
    { value: 'VIEW_HISTORY', label: 'View history' },
    { value: 'VIEW_ALERTS', label: 'View alerts' },
    { value: 'USE_REPORTS', label: 'Use reports' },
    { value: 'USE_TICKETS', label: 'Open tickets' },
    { value: 'USE_VISITS', label: 'Request visits' },
  ];

  protected readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    firstName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    lastName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
  });

  ngOnInit(): void {
    this.store.load();
    this.metersStore.load();
  }

  protected reload(): void {
    this.store.load();
    this.metersStore.load();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.store.create(
      {
        email: value.email ?? '',
        firstName: value.firstName ?? '',
        lastName: value.lastName ?? '',
      },
      {
        onSuccess: (subuser) => {
          this.form.reset({ email: '', firstName: '', lastName: '' });
          this.success.set('Subuser invited. Share the activation link privately.');
          this.activationLink.set(
            subuser.activationToken
              ? `${window.location.origin}/activate-password?token=${subuser.activationToken}`
              : null,
          );
        },
      },
    );
  }

  protected selectSubuser(value: string): void {
    this.selectedSubuserId.set(value);
    this.selectedMeterId.set('');
    this.selectedPermissions.set([]);
  }

  protected selectMeter(value: string): void {
    this.selectedMeterId.set(value);
    const subuser = this.items().find((item) => item.id === this.selectedSubuserId());
    this.selectedPermissions.set(
      subuser && value ? subuser.permissionsFor(value) : [],
    );
  }

  protected togglePermission(permission: MeterPermission, checked: boolean): void {
    this.selectedPermissions.update((current) =>
      checked ? [...current, permission] : current.filter((item) => item !== permission),
    );
  }

  protected hasPermission(permission: MeterPermission): boolean {
    return this.selectedPermissions().includes(permission);
  }

  protected saveGrants(): void {
    const subuserId = this.selectedSubuserId();
    const meterId = this.selectedMeterId();
    if (!subuserId || !meterId) return;
    this.store.updateGrants(subuserId, meterId, this.selectedPermissions(), {
      onSuccess: () => this.success.set('Access grant saved.'),
    });
  }

  protected copyActivation(): void {
    const link = this.activationLink();
    if (link) navigator.clipboard?.writeText(link);
  }
}
