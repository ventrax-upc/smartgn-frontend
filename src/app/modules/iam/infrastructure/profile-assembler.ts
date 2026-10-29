import { Injectable } from '@angular/core';
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { Profile } from '../domain/model/profile.entity';
import { ProfileInputResource, ProfileResource, ProfileResponse } from './profile-response';

@Injectable({ providedIn: 'root' })
export class ProfileAssembler
  implements BaseAssembler<Profile, ProfileResource, ProfileResponse>
{
  toEntityFromResource(resource: ProfileResource): Profile {
    return new Profile({
      id: resource.id,
      accountId: resource.accountId,
      firstName: resource.firstName,
      lastName: resource.lastName,
      phone: resource.phone,
      address: resource.address,
    });
  }

  toResourceFromEntity(entity: Profile): ProfileResource {
    return {
      id: entity.id,
      accountId: entity.accountId,
      firstName: entity.firstName,
      lastName: entity.lastName,
      phone: entity.phone,
      address: entity.address,
    };
  }

  toInputFromEntity(entity: Profile): ProfileInputResource {
    return {
      firstName: entity.firstName,
      lastName: entity.lastName,
      phone: entity.phone,
      address: entity.address,
    };
  }

  toEntitiesFromResponse(_response: ProfileResponse): Profile[] {
    return [];
  }
}
