import { Injectable, computed, inject, signal } from '@angular/core';
import { SupplyPointsApi } from '../infrastructure/supply-points-api';
import { SupplyPoint } from '../domain/model/supply-point.entity';

@Injectable({ providedIn: 'root' })
export class SupplyPointsStore {
  private readonly api = inject(SupplyPointsApi);

  private readonly itemsSignal = signal<SupplyPoint[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly savingSignal = signal(false);
  readonly saving = this.savingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly count = computed(() => this.itemsSignal().length);
  readonly activeItems = computed(() => this.itemsSignal().filter((point) => point.active));

  load(propertyId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.itemsSignal.set([]);
    this.api.getAll(propertyId).subscribe({
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
    propertyId: string,
    payload: { serialNumber: string; locationName: string },
    callbacks?: { onSuccess?: (point: SupplyPoint) => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.create(propertyId, payload).subscribe({
      next: (point) => {
        this.itemsSignal.update((items) => [...items, point]);
        this.savingSignal.set(false);
        callbacks?.onSuccess?.(point);
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  update(
    point: SupplyPoint,
    locationName: string,
    callbacks?: { onSuccess?: (point: SupplyPoint) => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.update(point.id, { locationName, version: point.version }).subscribe({
      next: (updated) => {
        this.itemsSignal.update((items) =>
          items.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.savingSignal.set(false);
        callbacks?.onSuccess?.(updated);
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
