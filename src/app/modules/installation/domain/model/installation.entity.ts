import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export type InstallationStatus =
  | 'PROVISIONAL'
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export class Installation implements BaseEntity {
  private readonly _id: string;
  private readonly _accountId: string | null;
  private readonly _propertyId: string;
  private readonly _pointId: string;
  private readonly _installerId: string | null;
  private readonly _status: InstallationStatus;
  private readonly _deviceId: string | null;
  private readonly _createdAt: string;
  private readonly _completedAt: string | null;
  private readonly _version: number;
  private readonly _propertyName: string;
  private readonly _pointName: string;
  private readonly _installerName: string;
  private readonly _deviceSerialNumber: string;

  constructor(props: {
    id: string;
    accountId?: string | null;
    propertyId: string;
    pointId: string;
    installerId?: string | null;
    status: InstallationStatus;
    deviceId?: string | null;
    createdAt: string;
    completedAt?: string | null;
    version?: number;
    propertyName?: string;
    pointName?: string;
    installerName?: string;
    deviceSerialNumber?: string;
  }) {
    this._id = props.id;
    this._accountId = props.accountId ?? null;
    this._propertyId = props.propertyId;
    this._pointId = props.pointId;
    this._installerId = props.installerId ?? null;
    this._status = props.status;
    this._deviceId = props.deviceId ?? null;
    this._createdAt = props.createdAt;
    this._completedAt = props.completedAt ?? null;
    this._version = props.version ?? 0;
    this._propertyName = props.propertyName ?? '';
    this._pointName = props.pointName ?? '';
    this._installerName = props.installerName ?? '';
    this._deviceSerialNumber = props.deviceSerialNumber ?? '';
  }

  get id(): string {
    return this._id;
  }

  get accountId(): string | null {
    return this._accountId;
  }

  get propertyId(): string {
    return this._propertyId;
  }

  get pointId(): string {
    return this._pointId;
  }

  get installerId(): string | null {
    return this._installerId;
  }

  get status(): InstallationStatus {
    return this._status;
  }

  get deviceId(): string | null {
    return this._deviceId;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get completedAt(): string | null {
    return this._completedAt;
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

  get installerName(): string {
    return this._installerName;
  }

  get deviceSerialNumber(): string {
    return this._deviceSerialNumber;
  }

  get isOpen(): boolean {
    return !['COMPLETED', 'CANCELLED'].includes(this._status);
  }

  get canAssign(): boolean {
    return ['PROVISIONAL', 'PENDING', 'ASSIGNED'].includes(this._status);
  }

  get canStart(): boolean {
    return this._status === 'ASSIGNED' && Boolean(this._installerId);
  }

  get canComplete(): boolean {
    return this._status === 'IN_PROGRESS';
  }
}
