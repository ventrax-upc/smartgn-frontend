import { Injectable } from '@angular/core';
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { Device, ProvisioningReceipt } from '../domain/model/device.entity';
import {
  DeviceResponse,
  DeviceResource,
  ProvisioningReceiptResource,
} from './device-response';

@Injectable({ providedIn: 'root' })
export class DeviceAssembler
  implements BaseAssembler<Device, DeviceResource, DeviceResponse>
{
  toEntityFromResource(resource: DeviceResource): Device {
    return new Device({
      id: String(resource.id),
      serialNumber: resource.serialNumber,
      accountId: resource.accountId,
      propertyId: resource.propertyId,
      pointId: resource.pointId,
      installationId: resource.installationId,
      installerId: resource.installerId,
      location: resource.location,
      installedAt: resource.installedAt,
      status: resource.status,
      associationVersion: resource.associationVersion,
      brokerConfirmed: resource.brokerConfirmed,
      telemetryConfirmed: resource.telemetryConfirmed,
      version: resource.version,
      propertyName: resource.propertyName,
      pointName: resource.pointName,
    });
  }

  toResourceFromEntity(entity: Device): DeviceResource {
    return {
      id: entity.id,
      serialNumber: entity.serialNumber,
      accountId: entity.accountId,
      propertyId: entity.propertyId,
      pointId: entity.pointId,
      installationId: entity.installationId,
      installerId: entity.installerId,
      location: entity.location,
      installedAt: entity.installedAt,
      status: entity.status,
      associationVersion: entity.associationVersion,
      brokerConfirmed: entity.brokerConfirmed,
      telemetryConfirmed: entity.telemetryConfirmed,
      version: entity.version,
    };
  }

  toReceipt(resource: ProvisioningReceiptResource): ProvisioningReceipt {
    return {
      device: this.toEntityFromResource(resource.device),
      credential: resource.credential,
      testMode: resource.testMode,
    };
  }

  toEntitiesFromResponse(response: DeviceResponse): Device[] {
    return response.map((resource) => this.toEntityFromResource(resource));
  }
}
