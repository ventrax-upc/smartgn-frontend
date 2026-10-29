import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export type PropertyType = 'HOUSE' | 'COMMERCIAL' | 'BUILDING';

/*
  Property owned by a principal USER account. Deactivation is logical: the
  backend keeps history and increments the optimistic version.
*/
export class Property implements BaseEntity {
  private readonly _id: string;
  private readonly _accountId: string;
  private readonly _name: string;
  private readonly _address: string;
  private readonly _propertyType: PropertyType;
  private readonly _active: boolean;
  private readonly _version: number;

  constructor(props: {
    id: string;
    accountId: string;
    name: string;
    address: string;
    propertyType: PropertyType;
    active?: boolean;
    version?: number;
  }) {
    this._id = props.id;
    this._accountId = props.accountId;
    this._name = props.name;
    this._address = props.address;
    this._propertyType = props.propertyType;
    this._active = props.active ?? true;
    this._version = props.version ?? 0;
  }

  get id(): string {
    return this._id;
  }

  get accountId(): string {
    return this._accountId;
  }

  get name(): string {
    return this._name;
  }

  get address(): string {
    return this._address;
  }

  get propertyType(): PropertyType {
    return this._propertyType;
  }

  get active(): boolean {
    return this._active;
  }

  get version(): number {
    return this._version;
  }

  get typeLabel(): string {
    switch (this._propertyType) {
      case 'HOUSE':
        return 'House';
      case 'COMMERCIAL':
        return 'Commercial';
      case 'BUILDING':
        return 'Building';
      default:
        return this._propertyType;
    }
  }
}
