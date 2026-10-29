import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export class SupplyPoint implements BaseEntity {
  private readonly _id: string;
  private readonly _propertyId: string;
  private readonly _serialNumber: string;
  private readonly _locationName: string;
  private readonly _active: boolean;
  private readonly _version: number;

  constructor(props: {
    id: string;
    propertyId: string;
    serialNumber: string;
    locationName: string;
    active?: boolean;
    version?: number;
  }) {
    this._id = props.id;
    this._propertyId = props.propertyId;
    this._serialNumber = props.serialNumber;
    this._locationName = props.locationName;
    this._active = props.active ?? true;
    this._version = props.version ?? 0;
  }

  get id(): string {
    return this._id;
  }

  get propertyId(): string {
    return this._propertyId;
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
}
