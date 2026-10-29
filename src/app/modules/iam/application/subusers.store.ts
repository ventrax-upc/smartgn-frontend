import { Injectable, computed, inject, signal } from '@angular/core';
import { SubuserApi } from '../infrastructure/subuser-api';
import { MeterPermission, Subuser } from '../domain/model/subuser.entity';

@Injectable({ providedIn: 'root' })
export class SubusersStore {
  private readonly api = inject(SubuserApi);

  private readonly itemsSignal = signal<Subuser[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly savingSignal = signal(false);
  readonly saving = this.savingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly count = computed(() => this.itemsSignal().length);
  readonly activeCount = computed(() => this.itemsSignal().filter((s) => s.isActive).length);
  readonly pendingCount = computed(
    () => this.itemsSignal().filter((s) => s.status === 'PENDING_ACTIVATION').length,
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
    payload: { email: string; firstName: string; lastName: string },
    callbacks?: { onSuccess?: (subuser: Subuser) => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.create(payload).subscribe({
      next: (subuser) => {
        this.itemsSignal.update((items) => [subuser, ...items]);
        this.savingSignal.set(false);
        callbacks?.onSuccess?.(subuser);
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  updateGrants(
    subuserId: string,
    meterId: string,
    permissions: MeterPermission[],
    callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.updateGrants(subuserId, meterId, permissions).subscribe({
      next: () => {
        this.itemsSignal.update((items) =>
          items.map((item) =>
            item.id === subuserId
              ? new Subuser({
                  id: item.id,
                  email: item.email,
                  firstName: item.firstName,
                  lastName: item.lastName,
                  role: item.role,
                  accountKind: item.accountKind,
                  status: item.status,
                  principalAccountId: item.principalAccountId,
                  createdAt: item.createdAt,
                  activationToken: item.activationToken,
                  grants: [
                    ...item.grants.filter((grant) => grant.meterId !== meterId),
                    ...(permissions.length > 0 ? [{ meterId, permissions }] : []),
                  ],
                })
              : item,
          ),
        );
        this.savingSignal.set(false);
        callbacks?.onSuccess?.();
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  private messageFrom(err: unknown): string {
    return err instanceof Error && err.message
      ? err.message
      : 'Could not complete the operation.';
  }
}
