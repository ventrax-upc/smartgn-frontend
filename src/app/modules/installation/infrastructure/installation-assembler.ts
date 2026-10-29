import { Injectable } from '@angular/core';
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { Installation } from '../domain/model/installation.entity';
import { InstallationResponse, InstallationResource } from './installation-response';

@Injectable({ providedIn: 'root' })
export class InstallationAssembler
  implements BaseAssembler<Installation, InstallationResource, InstallationResponse>
{
  toEntityFromResource(resource: InstallationResource): Installation {
    return new Installation({
      id: String(resource.id),
      accountId: resource.accountId,
      propertyId: resource.propertyId,
      pointId: resource.pointId,
      installerId: resource.installerId,
      status: resource.status,
      deviceId: resource.deviceId,
      createdAt: resource.createdAt,
      completedAt: resource.completedAt,
      version: resource.version,
      propertyName: resource.propertyName,
      pointName: resource.pointName,
      installerName: resource.installerName,
      deviceSerialNumber: resource.deviceSerialNumber,
    });
  }

  toResourceFromEntity(entity: Installation): InstallationResource {
    return {
      id: entity.id,
      accountId: entity.accountId,
      propertyId: entity.propertyId,
      pointId: entity.pointId,
      installerId: entity.installerId,
      status: entity.status,
      deviceId: entity.deviceId,
      createdAt: entity.createdAt,
      completedAt: entity.completedAt,
      version: entity.version,
      propertyName: entity.propertyName,
      pointName: entity.pointName,
      installerName: entity.installerName,
      deviceSerialNumber: entity.deviceSerialNumber,
    };
  }

  toEntitiesFromResponse(response: InstallationResponse): Installation[] {
    return response.map((resource) => this.toEntityFromResource(resource));
  }
}
