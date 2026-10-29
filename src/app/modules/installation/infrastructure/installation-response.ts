import { BaseResource } from '../../../shared/infrastructure/base-response';
import { InstallationStatus } from '../domain/model/installation.entity';

export interface InstallationResource extends BaseResource {
  id: string;
  accountId: string | null;
  propertyId: string;
  pointId: string;
  installerId: string | null;
  status: InstallationStatus;
  deviceId: string | null;
  createdAt: string;
  completedAt: string | null;
  version: number;
  propertyName?: string;
  pointName?: string;
  installerName?: string;
  deviceSerialNumber?: string;
}

export interface CreateInstallationResource {
  propertyId: string;
  pointId: string;
}

export type InstallationResponse = InstallationResource[];
