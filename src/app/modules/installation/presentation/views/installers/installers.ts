import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { InstallersStore } from '../../../application/installers.store';
import { Installer } from '../../../domain/model/installer.entity';
import { InstallerInputResource } from '../../../infrastructure/installer-response';
import { ConfirmDialog } from '../../../../../shared/presentation/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-installers',
  imports: [ReactiveFormsModule, MatIcon],
  templateUrl: './installers.html',
  styleUrl: './installers.css',
})
export class InstallersPage implements OnInit {
  private readonly store = inject(InstallersStore);
  private readonly dialog = inject(MatDialog);

  protected readonly items = this.store.items;
  protected readonly loading = this.store.loading;
  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;
  protected readonly count = this.store.count;
  protected readonly availableCount = this.store.availableCount;

  protected readonly editing = signal<Installer | null>(null);
  protected readonly showForm = signal(false);
  protected readonly success = signal<string | null>(null);

  protected readonly formTitle = computed(() =>
    this.editing() ? 'Edit installer' : 'Register an installer',
  );

  protected readonly form = new FormGroup({
    firstName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    lastName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    identification: new FormControl('', [Validators.required, Validators.maxLength(20)]),
    phone: new FormControl('', [Validators.required, Validators.maxLength(30)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    accreditationCode: new FormControl('', [Validators.required, Validators.maxLength(40)]),
    available: new FormControl(true),
  });

  ngOnInit(): void {
    this.store.load();
  }

  protected reload(): void {
    this.store.load();
  }

  protected startCreate(): void {
    this.editing.set(null);
    this.form.reset({
      firstName: '',
      lastName: '',
      identification: '',
      phone: '',
      email: '',
      accreditationCode: '',
      available: true,
    });
    this.showForm.set(true);
    this.success.set(null);
  }

  protected startEdit(installer: Installer): void {
    this.editing.set(installer);
    this.form.reset({
      firstName: installer.firstName,
      lastName: installer.lastName,
      identification: installer.identification,
      phone: installer.phone,
      email: installer.email,
      accreditationCode: installer.accreditationCode,
      available: installer.available,
    });
    this.showForm.set(true);
    this.success.set(null);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const input: InstallerInputResource = {
      firstName: value.firstName ?? '',
      lastName: value.lastName ?? '',
      identification: value.identification ?? '',
      phone: value.phone ?? '',
      email: value.email ?? '',
      accreditationCode: value.accreditationCode ?? '',
      available: value.available ?? false,
    };
    const editing = this.editing();
    const onSuccess = () => {
      this.showForm.set(false);
      this.editing.set(null);
      this.success.set(editing ? 'Installer updated.' : 'Installer registered.');
    };
    if (editing) this.store.update(editing, input, { onSuccess });
    else this.store.create(input, { onSuccess });
  }

  protected toggleStatus(installer: Installer): void {
    const action = installer.enabled ? 'Disable' : 'Enable';
    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        titleKey: `${action} installer`,
        messageKey: `${action} ${installer.fullName}? ${
          installer.enabled
            ? 'They will stop receiving new installation assignments.'
            : 'They will be available for new assignments again.'
        }`,
        confirmKey: action,
        iconName: installer.enabled ? 'person_off' : 'person_add',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.toggleStatus(installer, {
          onSuccess: () => this.success.set(`Installer ${installer.enabled ? 'disabled' : 'enabled'}.`),
        });
      }
    });
  }
}
