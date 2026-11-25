import { FormDialog } from '../../../../../shared/presentation/components/form-dialog';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from '../../../../../shared/presentation/components/confirm-dialog/confirm-dialog';
import { SmartgnSelect } from '../../../../../shared/presentation/components/smartgn-select';
import { EmptyState, LoadingState } from '../../../../../shared/presentation/components/view-state';
import { MatSelectModule } from '@angular/material/select';
import { pollWhileVisible } from '../../../../../shared/application/visible-polling';
import { TranslatePipe } from '@ngx-translate/core';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { SubusersStore } from '../../../application/subusers.store';
import { MeterPermission } from '../../../domain/model/subuser.entity';
import { MetersStore } from '../../../../installation/application/meters.store';

@Component({
  selector: 'app-subusers',
  imports: [FormDialog, SmartgnSelect, EmptyState, LoadingState, MatSelectModule, TranslatePipe, ReactiveFormsModule, MatIcon],
  templateUrl: './subusers.html',
  styleUrl: './subusers.css',
})
export class SubusersPage implements OnInit {
  private readonly dialog = inject(MatDialog);
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

  protected readonly openForm = signal<'invite' | 'grant' | null>(null);

  protected readonly success = signal<string | null>(null);
  protected readonly activationLink = signal<string | null>(null);

  protected readonly selectedSubuserId = signal('');
  protected readonly selectedMeterId = signal('');
  protected readonly selectedPermissions = signal<MeterPermission[]>([]);

  protected readonly permissions: Array<{ value: MeterPermission; label: string }> = [
    { value: 'VIEW_CONSUMPTION', label: 'ui.viewConsumption' },
    { value: 'VIEW_HISTORY', label: 'ui.viewHistory' },
    { value: 'VIEW_ALERTS', label: 'ui.viewAlerts' },
    { value: 'USE_REPORTS', label: 'ui.useReports' },
    { value: 'USE_TICKETS', label: 'ui.openTickets' },
    { value: 'USE_VISITS', label: 'ui.requestVisits' },
  ];

  protected readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    firstName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    lastName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
  });

  constructor() {
    pollWhileVisible(null, () => this.reload());
  }

  ngOnInit(): void {
    this.store.load();
    this.metersStore.load();
  }

  private reload(): void {
    if (this.loading() || this.saving() || this.openForm() !== null) return;
    this.store.load();
    this.metersStore.load();
  }

  protected startInvite(): void {
    this.form.reset({ email: '', firstName: '', lastName: '' });
    this.openForm.set('invite');
  }

  protected startGrant(subuserId: string): void {
    this.selectSubuser(subuserId);
    this.openForm.set('grant');
  }

  protected closeForm(): void {
    this.openForm.set(null);
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
          this.closeForm();
          this.form.reset({ email: '', firstName: '', lastName: '' });
          this.success.set('ui.subuserInvitedShareTheActivationLinkPrivately');
          this.activationLink.set(
            subuser.activationToken
              ? `${window.location.origin}/activate-password?token=${subuser.activationToken}`
              : null,
          );
        },
      },
    );
  }

  protected removeSubuser(subuserId: string): void {
    this.dialog.open(ConfirmDialog, {
      data: {
        titleKey: 'ui.removeSubuser',
        messageKey: 'ui.confirmRemoveSubuser',
        confirmKey: 'ui.removeSubuser',
        iconName: 'person_remove',
      },
    }).afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.success.set(null);
      this.activationLink.set(null);
      this.store.remove(subuserId, () => {
        if (this.selectedSubuserId() === subuserId) this.selectSubuser('');
        this.success.set('ui.subuserRemoved');
      });
    });
  }

  protected resendInvitation(subuserId: string): void {
    this.success.set(null);
    this.activationLink.set(null);
    this.store.resendInvitation(subuserId, () => this.success.set('ui.invitationResent'));
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
      onSuccess: () => {
        this.closeForm();
        this.success.set('ui.accessGrantSaved');
      },
    });
  }

  protected copyActivation(): void {
    const link = this.activationLink();
    if (link) navigator.clipboard?.writeText(link);
  }
}
