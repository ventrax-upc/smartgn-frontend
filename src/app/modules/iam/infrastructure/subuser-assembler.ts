import { Injectable } from '@angular/core';
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { Subuser } from '../domain/model/subuser.entity';
import { SubuserResource } from './subuser-response';

@Injectable({ providedIn: 'root' })
export class SubuserAssembler
  implements BaseAssembler<Subuser, SubuserResource, SubuserResource[]>
{
  toEntityFromResource(resource: SubuserResource): Subuser {
    return new Subuser({
      id: String(resource.id),
      email: resource.email,
      firstName: resource.firstName,
      lastName: resource.lastName,
      role: resource.role,
      accountKind: resource.accountKind,
      status: resource.status,
      principalAccountId: resource.principalAccountId,
      createdAt: resource.createdAt,
      grants: resource.grants ?? [],
      activationToken: resource.activationToken ?? null,
    });
  }

  toResourceFromEntity(entity: Subuser): SubuserResource {
    return {
      id: entity.id,
      email: entity.email,
      firstName: entity.firstName,
      lastName: entity.lastName,
      role: entity.role,
      accountKind: entity.accountKind,
      status: entity.status,
      principalAccountId: entity.principalAccountId,
      createdAt: entity.createdAt,
      grants: entity.grants,
    };
  }

  toEntitiesFromResponse(response: SubuserResource[]): Subuser[] {
    return response.map((resource) => this.toEntityFromResource(resource));
  }
}
