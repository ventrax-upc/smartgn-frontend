import { BaseResource } from '../../../shared/infrastructure/base-response';

export interface SupplyPointResource extends BaseResource {
  id: string;
  propertyId: string;
  serialNumber: string;
  locationName: string;
  active: boolean;
  version: number;
}

export interface SupplyPointInputResource {
  serialNumber: string;
  locationName: string;
}

export interface SupplyPointUpdateResource {
  locationName: string;
  version: number;
}

export type SupplyPointResponse = SupplyPointResource[];
