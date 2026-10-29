import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/*
  Mirrors the Technician entity from the support-maintenance service.
  GET /support/technicians only returns technicians that are available and
  active, so the directory is an assignment pool rather than a full registry.
*/
export class Technician implements BaseEntity {
  private readonly _id: string;
  private readonly _fullName: string;
  private readonly _accreditationCode: string;
  private readonly _email: string;
  private readonly _phone: string;
  private readonly _available: boolean;
  private readonly _active: boolean;

  constructor(props: {
    id: string;
    fullName: string;
    accreditationCode: string;
    email: string;
    phone: string;
    available: boolean;
    active: boolean;
  }) {
    this._id = props.id;
    this._fullName = props.fullName;
    this._accreditationCode = props.accreditationCode;
    this._email = props.email;
    this._phone = props.phone;
    this._available = props.available;
    this._active = props.active;
  }

  get id(): string {
    return this._id;
  }

  get fullName(): string {
    return this._fullName;
  }

  get accreditationCode(): string {
    return this._accreditationCode;
  }

  get email(): string {
    return this._email;
  }

  get phone(): string {
    return this._phone;
  }

  get available(): boolean {
    return this._available;
  }

  get active(): boolean {
    return this._active;
  }

  get initials(): string {
    return this._fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
}
