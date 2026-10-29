import { Injectable } from '@angular/core';
import { Meter } from '../domain/model/meter.entity';
import { MeterAccessResource, MeterAccessResponse } from './meter-response';

@Injectable({ providedIn: 'root' })
export class MeterAssembler {
  toEntityFromResource(resource: MeterAccessResource): Meter {
    return new Meter({
      id: String(resource.meter.id),
      propertyId: resource.meter.propertyId,
      propertyName: resource.meter.propertyName,
      serialNumber: resource.meter.serialNumber,
      locationName: resource.meter.locationName,
      active: resource.meter.active,
      version: resource.meter.version,
      permissions: resource.permissions,
    });
  }

  toResourceFromEntity(entity: Meter): MeterAccessResource {
    return {
      meter: {
        id: entity.id,
        propertyId: entity.propertyId,
        propertyName: entity.propertyName,
        serialNumber: entity.serialNumber,
        locationName: entity.locationName,
        active: entity.active,
        version: entity.version,
      },
      permissions: entity.permissions,
    };
  }

  toEntitiesFromResponse(response: MeterAccessResponse): Meter[] {
    return response.map((resource) => this.toEntityFromResource(resource));
  }
}
