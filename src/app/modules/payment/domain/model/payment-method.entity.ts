import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export class PaymentMethod implements BaseEntity {
  private readonly _id: string;
  private readonly _brand: string;
  private readonly _lastFour: string;
  private readonly _isDefault: boolean;
  private readonly _active: boolean;

  constructor(props: {
    id: string;
    brand: string;
    lastFour: string;
    isDefault?: boolean;
    active?: boolean;
  }) {
    this._id = props.id;
    this._brand = props.brand;
    this._lastFour = props.lastFour;
    this._isDefault = props.isDefault ?? false;
    this._active = props.active ?? true;
  }

  get id(): string {
    return this._id;
  }

  get brand(): string {
    return this._brand;
  }

  get lastFour(): string {
    return this._lastFour;
  }

  get isDefault(): boolean {
    return this._isDefault;
  }

  get active(): boolean {
    return this._active;
  }

  get label(): string {
    return `${this._brand} •••• ${this._lastFour}`;
  }
}
