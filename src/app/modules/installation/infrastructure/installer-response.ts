import { BaseResource } from '../../../shared/infrastructure/base-response';

export interface InstallerResource extends BaseResource {
  id: string;
  firstName: string;
  lastName: string;
  identification: string;
  phone: string;
  email: string;
  enabled: boolean;
  version: number;
  accreditationCode: string;
  available: boolean;
}

export interface InstallerInputResource {
  firstName: string;
  lastName: string;
  identification: string;
  phone: string;
  email: string;
  accreditationCode: string;
  available: boolean;
}

export interface InstallerUpdateResource {
  installer: InstallerInputResource;
  version: number;
}

export type InstallerResponse = InstallerResource[];
