import { Injectable, computed, inject, signal } from '@angular/core';
import { InstallationsApi } from '../infrastructure/installations-api';
import { Installation, InstallationStatus } from '../domain/model/installation.entity';

@Injectable({ providedIn: 'root' })
export class InstallationsStore {
  private readonly api = inject(InstallationsApi);

  private readonly itemsSignal = signal<Installation[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  private readonly statusFilterSignal = signal<InstallationStatus | 'ALL'>('ALL');
  readonly statusFilter = this.statusFilterSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly savingSignal = signal(false);
  readonly saving = this.savingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly openCount = computed(() => this.itemsSignal().filter((item) => item.isOpen).length);
  readonly completedCount = computed(
    () => this.itemsSignal().filter((item) => item.status === 'COMPLETED').length,
  );
  readonly inProgressCount = computed(
    () => this.itemsSignal().filter((item) => item.status === 'IN_PROGRESS').length,
  );
  readonly visibleItems = computed(() => {
    const filter = this.statusFilterSignal();
    return filter === 'ALL'
      ? this.itemsSignal()
      : this.itemsSignal().filter((item) => item.status === filter);
  });

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getAll().subscribe({
      next: (items) => {
        this.itemsSignal.set(items);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.messageFrom(err));
        this.loadingSignal.set(false);
      },
    });
  }

  setStatusFilter(status: InstallationStatus | 'ALL'): void {
    this.statusFilterSignal.set(status);
  }

  create(
    payload: { propertyId: string; pointId: string },
    callbacks?: { onSuccess?: (installation: Installation) => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.create(payload).subscribe({
      next: (installation) => {
        this.itemsSignal.update((items) => [installation, ...items]);
        this.savingSignal.set(false);
        callbacks?.onSuccess?.(installation);
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  assign(
    installation: Installation,
    installerId: string,
    callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.assign(installation.id, installerId).subscribe({
      next: (updated) => {
        this.replace(updated);
        this.savingSignal.set(false);
        callbacks?.onSuccess?.();
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  changeStatus(
    installation: Installation,
    status: InstallationStatus,
    callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.changeStatus(installation.id, status).subscribe({
      next: (updated) => {
        this.replace(updated);
        this.savingSignal.set(false);
        callbacks?.onSuccess?.();
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  cancel(
    installation: Installation,
    reason: string,
    callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.cancel(installation.id, installation.version, reason).subscribe({
      next: (updated) => {
        this.replace(updated);
        this.savingSignal.set(false);
        callbacks?.onSuccess?.();
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  private replace(updated: Installation): void {
    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  private messageFrom(err: unknown): string {
    return err instanceof Error && err.message
      ? err.message
      : 'Could not complete the operation.';
  }
}
