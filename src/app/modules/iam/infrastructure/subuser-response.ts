import { AccountKind, Role } from '../domain/model/user.entity';
import { MeterGrant, MeterPermission, SubuserStatus } from '../domain/model/subuser.entity';

export interface SubuserResource {
  id?: string;
  accountId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  accountKind?: AccountKind;
  status?: SubuserStatus;
  principalAccountId?: string;
  createdAt?: string;
  grants?: MeterGrant[];
  activationToken?: string | null;
}

export interface GrantsInputResource {
  meterId: string;
  permissions: MeterPermission[];
}
