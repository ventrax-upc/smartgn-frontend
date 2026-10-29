import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/*
  SmartGN IAM only recognises two roles. A delegated family member or staff
  member is still a USER; the distinction is carried by accountKind.
*/
export type Role = 'USER' | 'SUPERADMIN';
export type AccountKind = 'PRINCIPAL' | 'DELEGATED';

export class User implements BaseEntity {
  private readonly _id: string;
  private readonly _email: string;
  private readonly _role: Role;
  private readonly _accountKind: AccountKind;

  constructor(props: { id: string; email: string; role: Role; accountKind: AccountKind }) {
    this._id = props.id;
    this._email = props.email;
    this._role = props.role;
    this._accountKind = props.accountKind;
  }

  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get role(): Role {
    return this._role;
  }

  get accountKind(): AccountKind {
    return this._accountKind;
  }

  get isSuperAdmin(): boolean {
    return this._role === 'SUPERADMIN';
  }

  get isPrincipal(): boolean {
    return this._accountKind === 'PRINCIPAL';
  }

  get isDelegated(): boolean {
    return this._accountKind === 'DELEGATED';
  }

  get canManageProperties(): boolean {
    return this._role === 'USER' && this._accountKind === 'PRINCIPAL';
  }

  get canManageBilling(): boolean {
    return this._role === 'USER' && this._accountKind === 'PRINCIPAL';
  }
}
