import { BaseResource } from '../../../shared/infrastructure/base-response';
import { PropertyType } from '../domain/model/property.entity';

export interface PropertyResource extends BaseResource {
  id: string;
  accountId: string;
  name: string;
  address: string;
  propertyType: PropertyType;
  active: boolean;
  version: number;
}

export interface PropertyInputResource {
  name: string;
  address: string;
  propertyType: PropertyType;
}

export interface PropertyUpdateResource extends PropertyInputResource {
  version: number;
}

export type PropertyResponse = PropertyResource[];
