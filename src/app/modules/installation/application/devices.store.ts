import { Injectable, computed, inject, signal } from '@angular/core';
import { DevicesApi } from '../infrastructure/devices-api';
import { Device, DeviceStatus, ProvisioningReceipt } from '../domain/model/device.entity';
import { RegisterDeviceResource } from '../infrastructure/device-response';

@Injectable({ providedIn: 'root' })
export class DevicesStore {
  private readonly api = inject(DevicesApi);

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

  load(status?: DeviceStatus): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getAll({ status }).subscribe({
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
    callbacks?: { onSuccess?: (receipt: ProvisioningReceipt) => void; onError?: (message: string) => void },
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
    callbacks?: { onSuccess?: (receipt: ProvisioningReceipt) => void; onError?: (message: string) => void },
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

  private replace(updated: Device): void {
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
