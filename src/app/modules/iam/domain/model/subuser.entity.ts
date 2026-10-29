import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { AccountKind, Role } from './user.entity';

export type SubuserStatus = 'PENDING_ACTIVATION' | 'ACTIVE' | 'SUSPENDED';

export type MeterPermission =
  | 'VIEW_CONSUMPTION'
  | 'VIEW_HISTORY'
  | 'VIEW_ALERTS'
  | 'USE_REPORTS'
  | 'USE_TICKETS'
  | 'USE_VISITS';

export interface MeterGrant {
  meterId: string;
  permissions: MeterPermission[];
}

/*
  A subuser is a delegated USER account. It never gets its own role: the
  backend returns the account shape plus the grants the principal assigned.
*/
export class Subuser implements BaseEntity {
  private readonly _id: string;
  private readonly _email: string;
  private readonly _firstName: string;
  private readonly _lastName: string;
  private readonly _role: Role;
  private readonly _accountKind: AccountKind;
  private readonly _status: SubuserStatus;
  private readonly _principalAccountId: string;
  private readonly _createdAt: string;
  private readonly _grants: MeterGrant[];
  private readonly _activationToken: string | null;

  constructor(props: {
    id: string;
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
  }) {
    this._id = props.id;
    this._email = props.email;
    this._firstName = props.firstName ?? '';
    this._lastName = props.lastName ?? '';
    this._role = props.role ?? 'USER';
    this._accountKind = props.accountKind ?? 'DELEGATED';
    this._status = props.status ?? 'PENDING_ACTIVATION';
    this._principalAccountId = props.principalAccountId ?? '';
    this._createdAt = props.createdAt ?? '';
    this._grants = props.grants ?? [];
    this._activationToken = props.activationToken ?? null;
  }

  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get fullName(): string {
    return `${this._firstName} ${this._lastName}`.trim() || this._email;
  }

  get role(): Role {
    return this._role;
  }

  get accountKind(): AccountKind {
    return this._accountKind;
  }

  get status(): SubuserStatus {
    return this._status;
  }

  get principalAccountId(): string {
    return this._principalAccountId;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get grants(): MeterGrant[] {
    return this._grants;
  }

  get activationToken(): string | null {
    return this._activationToken;
  }

  permissionsFor(meterId: string): MeterPermission[] {
    return this._grants.find((grant) => grant.meterId === meterId)?.permissions ?? [];
  }

  get grantedMeters(): number {
    return this._grants.length;
  }

  get isActive(): boolean {
    return this._status === 'ACTIVE';
  }
}
