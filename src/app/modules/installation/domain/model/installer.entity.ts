import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export class Installer implements BaseEntity {
  private readonly _id: string;
  private readonly _firstName: string;
  private readonly _lastName: string;
  private readonly _identification: string;
  private readonly _phone: string;
  private readonly _email: string;
  private readonly _enabled: boolean;
  private readonly _version: number;
  private readonly _accreditationCode: string;
  private readonly _available: boolean;

  constructor(props: {
    id: string;
    firstName: string;
    lastName: string;
    identification: string;
    phone: string;
    email: string;
    enabled?: boolean;
    version?: number;
    accreditationCode: string;
    available?: boolean;
  }) {
    this._id = props.id;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._identification = props.identification;
    this._phone = props.phone;
    this._email = props.email;
    this._enabled = props.enabled ?? true;
    this._version = props.version ?? 0;
    this._accreditationCode = props.accreditationCode;
    this._available = props.available ?? false;
  }

  get id(): string {
    return this._id;
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

  get identification(): string {
    return this._identification;
  }

  get phone(): string {
    return this._phone;
  }

  get email(): string {
    return this._email;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get version(): number {
    return this._version;
  }

  get accreditationCode(): string {
    return this._accreditationCode;
  }

  get available(): boolean {
    return this._available;
  }

  get statusLabel(): string {
    if (!this._enabled) return 'Disabled';
    return this._available ? 'Available' : 'Unavailable';
  }
}
