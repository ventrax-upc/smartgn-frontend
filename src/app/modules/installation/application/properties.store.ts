import { Injectable, computed, inject, signal } from '@angular/core';
import { PropertiesApi } from '../infrastructure/properties-api';
import { Property, PropertyType } from '../domain/model/property.entity';

export interface PropertyPayload {
  name: string;
  address: string;
  propertyType: PropertyType;
}

@Injectable({ providedIn: 'root' })
export class PropertiesStore {
  private readonly api = inject(PropertiesApi);

  private readonly itemsSignal = signal<Property[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly savingSignal = signal(false);
  readonly saving = this.savingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly activeItems = computed(() => this.itemsSignal().filter((property) => property.active));
  readonly count = computed(() => this.activeItems().length);

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
    payload: PropertyPayload,
    callbacks?: { onSuccess?: (property: Property) => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.create(payload).subscribe({
      next: (property) => {
        this.itemsSignal.update((items) => [property, ...items]);
        this.savingSignal.set(false);
        callbacks?.onSuccess?.(property);
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  update(
    property: Property,
    payload: PropertyPayload,
    callbacks?: { onSuccess?: (property: Property) => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.update(property.id, { ...payload, version: property.version }).subscribe({
      next: (updated) => {
        this.replace(updated);
        this.savingSignal.set(false);
        callbacks?.onSuccess?.(updated);
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  deactivate(
    property: Property,
    callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.deactivate(property.id, property.version).subscribe({
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

  private replace(updated: Property): void {
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
