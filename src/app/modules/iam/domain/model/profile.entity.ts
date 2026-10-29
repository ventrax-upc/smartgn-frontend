import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/*
  UserProfile is the personal data attached to an IAM account. IAM keeps
  identity and profile separate: the sign-in response has no names, so the
  profile is loaded from /profiles/me right after authentication.
*/
export class Profile implements BaseEntity {
  private readonly _id: string;
  private readonly _accountId: string;
  private readonly _firstName: string;
  private readonly _lastName: string;
  private readonly _phone: string;
  private readonly _address: string;

  constructor(props: {
    id: string;
    accountId: string;
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
  }) {
    this._id = props.id;
    this._accountId = props.accountId;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._phone = props.phone ?? '';
    this._address = props.address ?? '';
  }

  get id(): string {
    return this._id;
  }

  get accountId(): string {
    return this._accountId;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get fullName(): string {
    return `${this._firstName} ${this._lastName}`.trim();
  }

  get phone(): string {
    return this._phone;
  }

  get address(): string {
    return this._address;
  }

  get initials(): string {
    return `${this._firstName.charAt(0)}${this._lastName.charAt(0)}`.toUpperCase();
  }

  get isComplete(): boolean {
    return this._firstName.trim().length > 0 && this._lastName.trim().length > 0;
  }
}
