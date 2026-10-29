import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/*
  Meter is the read model returned by GET /meters: a supply point plus the
  permissions the authenticated account holds over it.
*/
export class Meter implements BaseEntity {
  private readonly _id: string;
  private readonly _propertyId: string;
  private readonly _propertyName: string;
  private readonly _serialNumber: string;
  private readonly _locationName: string;
  private readonly _active: boolean;
  private readonly _version: number;
  private readonly _permissions: string[];

  constructor(props: {
    id: string;
    propertyId: string;
    propertyName?: string;
    serialNumber: string;
    locationName: string;
    active?: boolean;
    version?: number;
    permissions?: string[];
  }) {
    this._id = props.id;
    this._propertyId = props.propertyId;
    this._propertyName = props.propertyName ?? '';
    this._serialNumber = props.serialNumber;
    this._locationName = props.locationName;
    this._active = props.active ?? true;
    this._version = props.version ?? 0;
    this._permissions = props.permissions ?? [];
  }

  get id(): string {
    return this._id;
  }

  get propertyId(): string {
    return this._propertyId;
  }

  get propertyName(): string {
    return this._propertyName;
  }

  get serialNumber(): string {
    return this._serialNumber;
  }

  get locationName(): string {
    return this._locationName;
  }

  get active(): boolean {
    return this._active;
  }

  get version(): number {
    return this._version;
  }

  get permissions(): string[] {
    return this._permissions;
  }

  has(permission: string): boolean {
    return this._permissions.includes(permission);
  }

  get displayName(): string {
    return this._locationName || this._serialNumber;
  }
}
