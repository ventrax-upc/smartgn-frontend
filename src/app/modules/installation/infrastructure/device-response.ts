import { BaseResource } from '../../../shared/infrastructure/base-response';
import { DeviceStatus } from '../domain/model/device.entity';

export interface DeviceResource extends BaseResource {
  id: string;
  serialNumber: string;
  accountId: string;
  propertyId: string;
  pointId: string;
  installationId: string;
  installerId: string;
  location: string;
  installedAt: string;
  status: DeviceStatus;
  associationVersion: number;
  brokerConfirmed: boolean;
  telemetryConfirmed: boolean;
  version: number;
  propertyName?: string;
  pointName?: string;
}

export interface DeviceCredentialResource {
  clientId: string;
  username: string;
  password: string;
  expiresAt: string;
}

export interface ProvisioningReceiptResource {
  device: DeviceResource;
  credential: DeviceCredentialResource;
  testMode: boolean;
}

export interface RegisterDeviceResource {
  deviceId?: string;
  supplyPointId: string;
  installerId: string;
  installationId: string;
  serialNumber: string;
  location: string;
  installedAt: string;
  replacementGapReason?: string;
}

export type DeviceResponse = DeviceResource[];
