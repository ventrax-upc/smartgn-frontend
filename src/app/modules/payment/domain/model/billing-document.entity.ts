import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export type BillingDocumentType = 'INVOICE' | 'RECEIPT' | 'CREDIT_NOTE';
export type BillingDocumentStatus = 'ISSUED' | 'VOIDED';

export class BillingDocument implements BaseEntity {
  private readonly _id: string;
  private readonly _orderId: string;
  private readonly _type: BillingDocumentType;
  private readonly _number: string;
  private readonly _issuedAt: string;
  private readonly _total: number;
  private readonly _currency: string;
  private readonly _status: BillingDocumentStatus;

  constructor(props: {
    id: string;
    orderId: string;
    type: BillingDocumentType;
    number: string;
    issuedAt: string;
    total: number;
    currency: string;
    status: BillingDocumentStatus;
  }) {
    this._id = props.id;
    this._orderId = props.orderId;
    this._type = props.type;
    this._number = props.number;
    this._issuedAt = props.issuedAt;
    this._total = props.total;
    this._currency = props.currency;
    this._status = props.status;
  }

  get id(): string {
    return this._id;
  }

  get orderId(): string {
    return this._orderId;
  }

  get type(): BillingDocumentType {
    return this._type;
  }

  get number(): string {
    return this._number;
  }

  get issuedAt(): string {
    return this._issuedAt;
  }

  get total(): number {
    return this._total;
  }

  get currency(): string {
    return this._currency;
  }

  get status(): BillingDocumentStatus {
    return this._status;
  }
}
