import { FormDialog } from '../../../../../shared/presentation/components/form-dialog';
import { SmartgnSelect } from '../../../../../shared/presentation/components/smartgn-select';
import { EmptyState, LoadingState } from '../../../../../shared/presentation/components/view-state';
import { MatSelectModule } from '@angular/material/select';
import { pollWhileVisible } from '../../../../../shared/application/visible-polling';
import { TranslatePipe } from '@ngx-translate/core';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { DevicesStore } from '../../../application/devices.store';
import { InstallationsStore } from '../../../application/installations.store';
import { Device } from '../../../domain/model/device.entity';
import { ConfirmDialog } from '../../../../../shared/presentation/components/confirm-dialog/confirm-dialog';
import { AuthStore } from '../../../../iam/application/auth.store';

@Component({
  selector: 'app-devices',
  imports: [FormDialog, SmartgnSelect, EmptyState, LoadingState, MatSelectModule, TranslatePipe, ReactiveFormsModule, MatIcon],
  templateUrl: './devices.html',
  styleUrl: './devices.css',
})
export class DevicesPage implements OnInit {
  private readonly store = inject(DevicesStore);
  private readonly installationsStore = inject(InstallationsStore);
  private readonly dialog = inject(MatDialog);
  private readonly authStore = inject(AuthStore);

  protected readonly isSuperAdmin = this.authStore.isSuperAdmin;
  protected readonly items = this.store.items;
  protected readonly loading = this.store.loading;
  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;
  protected readonly showForm = signal(false);
  protected readonly receipt = this.store.receipt;

  protected readonly installations = computed(() =>
    this.installationsStore
      .items()
      .filter((installation) => installation.installerId && installation.status !== 'CANCELLED'),
  );

  protected readonly form = new FormGroup({
    installationId: new FormControl('', [Validators.required]),
    serialNumber: new FormControl('', [Validators.required, Validators.maxLength(160)]),
    location: new FormControl('', [Validators.required, Validators.maxLength(300)]),
    installedAt: new FormControl(this.localDateTime(), [Validators.required]),
  });

  constructor() {
    pollWhileVisible(30000, () => this.reload());
  }

  ngOnInit(): void {
    this.store.load();
    if (this.isSuperAdmin()) {
      this.installationsStore.load();
    }
  }

  private reload(): void {
    if (this.loading() || this.showForm() || this.saving()) return;
    this.store.load();
    if (this.isSuperAdmin()) {
      this.installationsStore.load();
    }
  }

  protected startCreate(): void {
    this.showForm.set(true);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
    this.form.reset({
      installationId: '',
      serialNumber: '',
      location: '',
      installedAt: this.localDateTime(),
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const installation = this.installations().find((item) => item.id === value.installationId);
    if (!installation || !installation.installerId) {
      return;
    }
    this.store.register(
      {
        supplyPointId: installation.pointId,
        installerId: installation.installerId,
        installationId: installation.id,
        serialNumber: value.serialNumber ?? '',
        location: value.location ?? '',
        installedAt: new Date(value.installedAt ?? '').toISOString(),
      },
      {
        onSuccess: () => this.cancelForm(),
      },
    );
  }

  protected rotate(device: Device): void {
    this.store.rotate(device);
  }

  protected revoke(device: Device): void {
    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        titleKey: 'Revoke device',
        messageKey: `Revoke ${device.serialNumber}? Publishing stops immediately and the credential is invalidated.`,
        confirmKey: 'Revoke device',
        iconName: 'link_off',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.store.revoke(device);
    });
  }

  protected clearReceipt(): void {
    this.store.clearReceipt();
  }

  protected copyCredential(): void {
    const credential = this.receipt()?.credential;
    if (!credential) return;
    navigator.clipboard?.writeText(
      `clientId=${credential.clientId}\nusername=${credential.username}\npassword=${credential.password}`,
    );
  }

  private localDateTime(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 16);
  }
}
