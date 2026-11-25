import { SmartgnSelect } from '../../../../../shared/presentation/components/smartgn-select';
import { EmptyState, LoadingState } from '../../../../../shared/presentation/components/view-state';
import { MatSelectModule } from '@angular/material/select';
import { pollWhileVisible } from '../../../../../shared/application/visible-polling';
import { LanguageService } from '../../../../../shared/application/language.service';
import { TranslatePipe } from '@ngx-translate/core';
import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { InstallationsStore } from '../../../application/installations.store';
import { InstallersStore } from '../../../application/installers.store';
import { Installation, InstallationStatus } from '../../../domain/model/installation.entity';
import { ConfirmDialog } from '../../../../../shared/presentation/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-installations',
  imports: [SmartgnSelect, EmptyState, LoadingState, MatSelectModule, TranslatePipe, DatePipe, MatIcon],
  templateUrl: './installations.html',
  styleUrl: './installations.css',
})
export class InstallationsPage implements OnInit {
  protected readonly lang = inject(LanguageService).lang;
  private readonly store = inject(InstallationsStore);
  private readonly installersStore = inject(InstallersStore);
  private readonly dialog = inject(MatDialog);

  protected readonly items = this.store.visibleItems;
  protected readonly loading = this.store.loading;
  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;
  protected readonly openCount = this.store.openCount;
  protected readonly completedCount = this.store.completedCount;
  protected readonly inProgressCount = this.store.inProgressCount;
  protected readonly installers = this.installersStore.items;
  protected readonly success = signal<string | null>(null);
  protected readonly selection = signal<Record<string, string>>({});

  protected readonly statuses: Array<InstallationStatus | 'ALL'> = [
    'ALL',
    'PROVISIONAL',
    'PENDING',
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
  ];

  constructor() {
    pollWhileVisible(30000, () => this.reload());
  }

  ngOnInit(): void {
    this.store.load();
    this.installersStore.load();
  }

  protected readonly statusFilter = this.store.statusFilter;

  protected filterStatus(status: InstallationStatus | 'ALL'): void {
    this.store.setStatusFilter(status);
  }

  private reload(): void {
    if (this.loading() || this.saving()) return;
    this.store.load();
    this.installersStore.load();
  }

  protected selectInstaller(installation: Installation, installerId: string): void {
    this.selection.update((current) => ({ ...current, [installation.id]: installerId }));
  }

  protected selectedInstaller(installation: Installation): string {
    return this.selection()[installation.id] ?? '';
  }

  protected assign(installation: Installation): void {
    const installerId = this.selectedInstaller(installation);
    if (!installation.canAssign || !installerId) return;
    this.store.assign(installation, installerId, {
      onSuccess: () => this.success.set('ui.installerAssigned'),
    });
  }

  protected start(installation: Installation): void {
    this.store.changeStatus(installation, 'IN_PROGRESS', {
      onSuccess: () => this.success.set('ui.installationMovedToInProgress'),
    });
  }

  protected complete(installation: Installation): void {
    this.store.changeStatus(installation, 'COMPLETED', {
      onSuccess: () => this.success.set('ui.installationCompleted'),
    });
  }

  protected cancel(installation: Installation): void {
    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        titleKey: 'Cancel installation',
        messageKey: `Cancel the installation for ${installation.pointName || installation.pointId}? The record is preserved for audit.`,
        confirmKey: 'Cancel installation',
        iconName: 'cancel',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.cancel(installation, 'Cancelled from the SmartGN operations console', {
          onSuccess: () => this.success.set('ui.installationCancelled'),
        });
      }
    });
  }

  protected installerLabel(installation: Installation): string {
    return installation.installerName ||
      this.installers().find((installer) => installer.id === installation.installerId)?.fullName ||
      installation.installerId || '';
  }

  protected availableInstallers() {
    return this.installers().filter((installer) => installer.enabled && installer.available);
  }

  protected showChip(status: InstallationStatus, value: string): boolean {
    return status === value;
  }
}
