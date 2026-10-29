import { Injectable, computed, inject, signal } from '@angular/core';
import { InstallersApi } from '../infrastructure/installers-api';
import { Installer } from '../domain/model/installer.entity';
import { InstallerInputResource } from '../infrastructure/installer-response';

@Injectable({ providedIn: 'root' })
export class InstallersStore {
  private readonly api = inject(InstallersApi);

  private readonly itemsSignal = signal<Installer[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly savingSignal = signal(false);
  readonly saving = this.savingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly count = computed(() => this.itemsSignal().length);
  readonly availableCount = computed(
    () => this.itemsSignal().filter((installer) => installer.enabled && installer.available).length,
  );

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

  create(
    input: InstallerInputResource,
    callbacks?: { onSuccess?: (installer: Installer) => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.create(input).subscribe({
      next: (installer) => {
        this.itemsSignal.update((items) => [installer, ...items]);
        this.savingSignal.set(false);
        callbacks?.onSuccess?.(installer);
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  update(
    installer: Installer,
    input: InstallerInputResource,
    callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.update(installer.id, input, installer.version).subscribe({
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

  toggleStatus(
    installer: Installer,
    callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.changeStatus(installer.id, !installer.enabled, installer.version).subscribe({
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

  private replace(updated: Installer): void {
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
