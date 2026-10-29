import { Injectable } from '@angular/core';
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { User } from '../domain/model/user.entity';
import { AuthenticatedUserResource, UserResponse } from './user-response';

@Injectable({ providedIn: 'root' })
export class UserAssembler
  implements BaseAssembler<User, AuthenticatedUserResource, UserResponse>
{
  toEntityFromResource(resource: AuthenticatedUserResource): User {
    return new User({
      id: resource.id,
      email: resource.email,
      role: resource.role,
      accountKind: resource.accountKind ?? 'PRINCIPAL',
    });
  }

  toResourceFromEntity(entity: User): AuthenticatedUserResource {
    return {
      id: entity.id,
      email: entity.email,
      role: entity.role,
      accountKind: entity.accountKind,
      token: '',
    };
  }

  toEntitiesFromResponse(_response: UserResponse): User[] {
    return [];
  }
}
