import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export type DeviceStatus = 'PENDING' | 'ACTIVE' | 'REVOKED' | 'FAILED';

export class Device implements BaseEntity {
  private readonly _id: string;
  private readonly _serialNumber: string;
  private readonly _accountId: string;
  private readonly _propertyId: string;
  private readonly _pointId: string;
  private readonly _installationId: string;
  private readonly _installerId: string;
  private readonly _location: string;
  private readonly _installedAt: string;
  private readonly _status: DeviceStatus;
  private readonly _associationVersion: number;
  private readonly _brokerConfirmed: boolean;
  private readonly _telemetryConfirmed: boolean;
  private readonly _version: number;
  private readonly _propertyName: string;
  private readonly _pointName: string;

  constructor(props: {
    id: string;
    serialNumber: string;
    accountId: string;
    propertyId: string;
    pointId: string;
    installationId: string;
    installerId: string;
    location: string;
    installedAt: string;
    status: DeviceStatus;
    associationVersion?: number;
    brokerConfirmed?: boolean;
    telemetryConfirmed?: boolean;
    version?: number;
    propertyName?: string;
    pointName?: string;
  }) {
    this._id = props.id;
    this._serialNumber = props.serialNumber;
    this._accountId = props.accountId;
    this._propertyId = props.propertyId;
    this._pointId = props.pointId;
    this._installationId = props.installationId;
    this._installerId = props.installerId;
    this._location = props.location;
    this._installedAt = props.installedAt;
    this._status = props.status;
    this._associationVersion = props.associationVersion ?? 1;
    this._brokerConfirmed = props.brokerConfirmed ?? false;
    this._telemetryConfirmed = props.telemetryConfirmed ?? false;
    this._version = props.version ?? 1;
    this._propertyName = props.propertyName ?? '';
    this._pointName = props.pointName ?? '';
  }

  get id(): string {
    return this._id;
  }

  get serialNumber(): string {
    return this._serialNumber;
  }

  get accountId(): string {
    return this._accountId;
  }

  get propertyId(): string {
    return this._propertyId;
  }

  get pointId(): string {
    return this._pointId;
  }

  get installationId(): string {
    return this._installationId;
  }

  get installerId(): string {
    return this._installerId;
  }

  get location(): string {
    return this._location;
  }

  get installedAt(): string {
    return this._installedAt;
  }

  get status(): DeviceStatus {
    return this._status;
  }

  get associationVersion(): number {
    return this._associationVersion;
  }

  get brokerConfirmed(): boolean {
    return this._brokerConfirmed;
  }

  get telemetryConfirmed(): boolean {
    return this._telemetryConfirmed;
  }

  get version(): number {
    return this._version;
  }

  get propertyName(): string {
    return this._propertyName;
  }

  get pointName(): string {
    return this._pointName;
  }

  get isPublishing(): boolean {
    return this._status === 'ACTIVE' && this._brokerConfirmed && this._telemetryConfirmed;
  }
}

export interface ProvisioningReceipt {
  device: Device;
  credential: {
    clientId: string;
    username: string;
    password: string;
    expiresAt: string;
  };
  testMode: boolean;
}
