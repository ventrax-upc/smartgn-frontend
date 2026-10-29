import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/*
  Mirrors SupportTicket + TicketStatus from the support-maintenance service.
  The backend returns the aggregate directly, so the HTTP contract uses
  ticketId, principalAccountId and meterId.
*/
export type TicketStatus = 'OPEN' | 'VISIT_REQUESTED' | 'RESOLVED' | 'CLOSED';

export class Ticket implements BaseEntity {
  private readonly _id: string;
  private readonly _principalAccountId: string;
  private readonly _meterId: string;
  private readonly _subject: string;
  private readonly _message: string;
  private readonly _status: TicketStatus;
  private readonly _createdAt: string;
  private readonly _resolvedAt: string | null;
  private readonly _closedAt: string | null;

  constructor(props: {
    id: string;
    principalAccountId: string;
    meterId: string;
    subject: string;
    message: string;
    status: TicketStatus;
    createdAt: string;
    resolvedAt?: string | null;
    closedAt?: string | null;
  }) {
    this._id = props.id;
    this._principalAccountId = props.principalAccountId;
    this._meterId = props.meterId;
    this._subject = props.subject;
    this._message = props.message;
    this._status = props.status;
    this._createdAt = props.createdAt;
    this._resolvedAt = props.resolvedAt ?? null;
    this._closedAt = props.closedAt ?? null;
  }

  get id(): string {
    return this._id;
  }

  get principalAccountId(): string {
    return this._principalAccountId;
  }

  get meterId(): string {
    return this._meterId;
  }

  get subject(): string {
    return this._subject;
  }

  get message(): string {
    return this._message;
  }

  get status(): TicketStatus {
    return this._status;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get resolvedAt(): string | null {
    return this._resolvedAt;
  }

  get closedAt(): string | null {
    return this._closedAt;
  }

  get isOpen(): boolean {
    return this._status === 'OPEN' || this._status === 'VISIT_REQUESTED';
  }

  get isClosed(): boolean {
    return this._status === 'CLOSED';
  }

  get canBeRated(): boolean {
    return this._status === 'RESOLVED' || this._status === 'CLOSED';
  }
}
