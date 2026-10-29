import { Injectable } from '@angular/core';
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { Property } from '../domain/model/property.entity';
import { PropertyResponse, PropertyResource } from './property-response';

@Injectable({ providedIn: 'root' })
export class PropertyAssembler
  implements BaseAssembler<Property, PropertyResource, PropertyResponse>
{
  toEntityFromResource(resource: PropertyResource): Property {
    return new Property({
      id: String(resource.id),
      accountId: resource.accountId,
      name: resource.name,
      address: resource.address,
      propertyType: resource.propertyType,
      active: resource.active,
      version: resource.version,
    });
  }

  toResourceFromEntity(entity: Property): PropertyResource {
    return {
      id: entity.id,
      accountId: entity.accountId,
      name: entity.name,
      address: entity.address,
      propertyType: entity.propertyType,
      active: entity.active,
      version: entity.version,
    };
  }

  toEntitiesFromResponse(response: PropertyResponse): Property[] {
    return response.map((resource) => this.toEntityFromResource(resource));
  }
}
