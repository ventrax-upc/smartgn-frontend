import { Injectable, computed, inject, signal } from '@angular/core';
import { Technician } from '../domain/model/technician.entity';
import { SupportApi } from '../infrastructure/support-api';
import { TechnicianInputResource } from '../infrastructure/support-response';

/*
  GET /support/technicians returns only available, active technicians, so this
  store is an assignment pool. There is no enable/disable endpoint in the
  support-maintenance service.
*/
@Injectable({ providedIn: 'root' })
export class TechniciansStore {
  private readonly api = inject(SupportApi);

  private readonly itemsSignal = signal<Technician[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly savingSignal = signal(false);
  readonly saving = this.savingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly count = computed(() => this.itemsSignal().length);
  readonly availableCount = computed(
    () => this.itemsSignal().filter((technician) => technician.available && technician.active).length,
  );

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getTechnicians().subscribe({
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
    input: TechnicianInputResource,
    callbacks?: { onSuccess?: (technician: Technician) => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.createTechnician(input).subscribe({
      next: (technician) => {
        this.itemsSignal.update((items) => [...items, technician]);
        this.savingSignal.set(false);
        callbacks?.onSuccess?.(technician);
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
