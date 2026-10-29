import { Injectable, computed, inject, signal } from '@angular/core';
import { MetersApi } from '../infrastructure/meters-api';
import { Meter } from '../domain/model/meter.entity';

@Injectable({ providedIn: 'root' })
export class MetersStore {
  private readonly api = inject(MetersApi);

  private readonly itemsSignal = signal<Meter[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly count = computed(() => this.itemsSignal().length);
  readonly propertyCount = computed(
    () => new Set(this.itemsSignal().map((meter) => meter.propertyId)).size,
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
        this.errorSignal.set(
          err instanceof Error ? err.message : 'Could not load your supply points.',
        );
        this.loadingSignal.set(false);
      },
    });
  }

  findById(id: string): Meter | undefined {
    return this.itemsSignal().find((meter) => meter.id === id);
  }
}
