import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { DevicesApi } from '../infrastructure/devices-api';
import { Device, DeviceStatus, ProvisioningReceipt } from '../domain/model/device.entity';
import { Property } from '../domain/model/property.entity';
import { SupplyPoint } from '../domain/model/supply-point.entity';
import { RegisterDeviceResource } from '../infrastructure/device-response';
import { MetersApi } from '../infrastructure/meters-api';
import { PropertiesApi } from '../infrastructure/properties-api';
import { SupplyPointsApi } from '../infrastructure/supply-points-api';
import { AuthStore } from '../../iam/application/auth.store';

@Injectable({ providedIn: 'root' })
export class DevicesStore {
  private readonly api = inject(DevicesApi);
  private readonly auth = inject(AuthStore);
  private readonly metersApi = inject(MetersApi);
  private readonly propertiesApi = inject(PropertiesApi);
  private readonly supplyPointsApi = inject(SupplyPointsApi);

  private readonly itemsSignal = signal<Device[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly savingSignal = signal(false);
  readonly saving = this.savingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  private readonly receiptSignal = signal<ProvisioningReceipt | null>(null);
  readonly receipt = this.receiptSignal.asReadonly();

  readonly count = computed(() => this.itemsSignal().length);
  readonly activeCount = computed(
    () => this.itemsSignal().filter((device) => device.status === 'ACTIVE').length,
  );
  readonly pendingCount = computed(
    () => this.itemsSignal().filter((device) => device.status === 'PENDING').length,
  );

  load(status?: DeviceStatus, properties?: Property[]): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    const request$ = this.auth.isSuperAdmin()
      ? this.api.getAll({ status })
      : this.auth.isDelegated()
        ? this.loadForDelegate(status)
        : this.loadForOwner(status, properties);
    request$.subscribe({
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

  register(
    input: RegisterDeviceResource,
    callbacks?: {
      onSuccess?: (receipt: ProvisioningReceipt) => void;
      onError?: (message: string) => void;
    },
  ): void {
    this.savingSignal.set(true);
    this.api.register(input).subscribe({
      next: (receipt) => {
        this.itemsSignal.update((items) => [receipt.device, ...items]);
        this.receiptSignal.set(receipt);
        this.savingSignal.set(false);
        callbacks?.onSuccess?.(receipt);
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  rotate(
    device: Device,
    callbacks?: {
      onSuccess?: (receipt: ProvisioningReceipt) => void;
      onError?: (message: string) => void;
    },
  ): void {
    this.savingSignal.set(true);
    this.api.rotateCredentials(device.id).subscribe({
      next: (receipt) => {
        this.replace(receipt.device);
        this.receiptSignal.set(receipt);
        this.savingSignal.set(false);
        callbacks?.onSuccess?.(receipt);
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  revoke(
    device: Device,
    callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
  ): void {
    this.savingSignal.set(true);
    this.api.revoke(device.id).subscribe({
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

  clearReceipt(): void {
    this.receiptSignal.set(null);
  }

  /*
    The backend only lets SuperAdmin list every device. An account owner must
    query by supply point, so we walk properties -> supply points -> devices.
  */
  private loadForOwner(status?: DeviceStatus, properties?: Property[]): Observable<Device[]> {
    const propertyList = properties ? of(properties) : this.propertiesApi.getAll();
    return propertyList.pipe(
      switchMap((properties) =>
        properties.length
          ? forkJoin(properties.map((property) => this.supplyPointsApi.getAll(property.id)))
          : of<SupplyPoint[][]>([]),
      ),
      map((groups) => groups.flat()),
      switchMap((points) =>
        points.length
          ? forkJoin(points.map((point) => this.api.getAll({ pointId: point.id, status })))
          : of<Device[][]>([]),
      ),
      map((groups) => groups.flat()),
    );
  }

  private loadForDelegate(status?: DeviceStatus): Observable<Device[]> {
    return this.metersApi.getAll().pipe(
      switchMap((meters) => {
        const requests = meters.flatMap((meter) => {
          const [permission] = meter.permissions;
          return permission
            ? [this.api.getAll({ pointId: meter.id, function: permission, status })]
            : [];
        });
        return requests.length ? forkJoin(requests) : of<Device[][]>([]);
      }),
      map((groups) => groups.flat()),
    );
  }

  private replace(updated: Device): void {
    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  private messageFrom(err: unknown): string {
    return err instanceof Error && err.message ? err.message : 'Could not complete the operation.';
  }
}
