import { Injectable } from '@angular/core';
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { SupplyPoint } from '../domain/model/supply-point.entity';
import { SupplyPointResponse, SupplyPointResource } from './supply-point-response';

@Injectable({ providedIn: 'root' })
export class SupplyPointAssembler
  implements BaseAssembler<SupplyPoint, SupplyPointResource, SupplyPointResponse>
{
  toEntityFromResource(resource: SupplyPointResource): SupplyPoint {
    return new SupplyPoint({
      id: String(resource.id),
      propertyId: resource.propertyId,
      serialNumber: resource.serialNumber,
      locationName: resource.locationName,
      active: resource.active,
      version: resource.version,
    });
  }

  toResourceFromEntity(entity: SupplyPoint): SupplyPointResource {
    return {
      id: entity.id,
      propertyId: entity.propertyId,
      serialNumber: entity.serialNumber,
      locationName: entity.locationName,
      active: entity.active,
      version: entity.version,
    };
  }

  toEntitiesFromResponse(response: SupplyPointResponse): SupplyPoint[] {
    return response.map((resource) => this.toEntityFromResource(resource));
  }
}
