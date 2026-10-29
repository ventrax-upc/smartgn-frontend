import { Injectable } from '@angular/core';
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { Installer } from '../domain/model/installer.entity';
import { InstallerResponse, InstallerResource } from './installer-response';

@Injectable({ providedIn: 'root' })
export class InstallerAssembler
  implements BaseAssembler<Installer, InstallerResource, InstallerResponse>
{
  toEntityFromResource(resource: InstallerResource): Installer {
    return new Installer({
      id: String(resource.id),
      firstName: resource.firstName,
      lastName: resource.lastName,
      identification: resource.identification,
      phone: resource.phone,
      email: resource.email,
      enabled: resource.enabled,
      version: resource.version,
      accreditationCode: resource.accreditationCode,
      available: resource.available,
    });
  }

  toResourceFromEntity(entity: Installer): InstallerResource {
    return {
      id: entity.id,
      firstName: entity.firstName,
      lastName: entity.lastName,
      identification: entity.identification,
      phone: entity.phone,
      email: entity.email,
      enabled: entity.enabled,
      version: entity.version,
      accreditationCode: entity.accreditationCode,
      available: entity.available,
    };
  }

  toEntitiesFromResponse(response: InstallerResponse): Installer[] {
    return response.map((resource) => this.toEntityFromResource(resource));
  }
}
