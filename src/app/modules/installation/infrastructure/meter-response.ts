import { SupplyPointResource } from './supply-point-response';

export interface MeterAccessResource {
  meter: SupplyPointResource & { propertyName?: string };
  permissions: string[];
}

export type MeterAccessResponse = MeterAccessResource[];
