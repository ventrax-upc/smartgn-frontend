import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { BillingDocument } from './billing-document.entity';

export type PaymentReason = 'INSTALLATION' | 'PRO' | 'TECHNICAL_VISIT';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export class PaymentLine {
  constructor(
    readonly description: string,
    readonly quantity: number,
    readonly unitPrice: number,
    readonly total: number,
  ) {}
}

export class PaymentAttempt {
  constructor(
    readonly id: string,
    readonly at: string,
    readonly status: string,
    readonly providerReference: string,
  ) {}
}

export class PaymentOrder implements BaseEntity {
  private readonly _id: string;
  private readonly _reason: PaymentReason;
  private readonly _amount: number;
  private readonly _currency: string;
  private readonly _status: PaymentStatus;
  private readonly _createdAt: string;
  private readonly _confirmedAt: string | null;
  private readonly _lines: PaymentLine[];
  private readonly _attempts: PaymentAttempt[];
  private readonly _documents: BillingDocument[];

  constructor(props: {
    id: string;
    reason: PaymentReason;
    amount: number;
    currency: string;
    status: PaymentStatus;
    createdAt: string;
    confirmedAt?: string | null;
    lines?: PaymentLine[];
    attempts?: PaymentAttempt[];
    documents?: BillingDocument[];
  }) {
    this._id = props.id;
    this._reason = props.reason;
    this._amount = props.amount;
    this._currency = props.currency;
    this._status = props.status;
    this._createdAt = props.createdAt;
    this._confirmedAt = props.confirmedAt ?? null;
    this._lines = props.lines ?? [];
    this._attempts = props.attempts ?? [];
    this._documents = props.documents ?? [];
  }

  get id(): string {
    return this._id;
  }

  get reason(): PaymentReason {
    return this._reason;
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  get status(): PaymentStatus {
    return this._status;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get confirmedAt(): string | null {
    return this._confirmedAt;
  }

  get lines(): PaymentLine[] {
    return this._lines;
  }

  get attempts(): PaymentAttempt[] {
    return this._attempts;
  }

  get documents(): BillingDocument[] {
    return this._documents;
  }

  get description(): string {
    return this._lines[0]?.description || this._reason;
  }

  get canPay(): boolean {
    return this._status === 'PENDING' || this._status === 'FAILED';
  }
}
