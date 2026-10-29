import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/*
  Mirrors TechnicalVisit + VisitStatus. Visits are always scoped to a ticket;
  the support service exposes GET /support/tickets/{ticketId}/visits, not a
  global visits collection.
*/
export type VisitStatus = 'REQUESTED' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';

export class Visit implements BaseEntity {
  private readonly _id: string;
  private readonly _ticketId: string;
  private readonly _requestedWindowStart: string | null;
  private readonly _requestedWindowEnd: string | null;
  private readonly _status: VisitStatus;
  private readonly _completedAt: string | null;

  constructor(props: {
    id: string;
    ticketId: string;
    requestedWindowStart?: string | null;
    requestedWindowEnd?: string | null;
    status: VisitStatus;
    completedAt?: string | null;
  }) {
    this._id = props.id;
    this._ticketId = props.ticketId;
    this._requestedWindowStart = props.requestedWindowStart ?? null;
    this._requestedWindowEnd = props.requestedWindowEnd ?? null;
    this._status = props.status;
    this._completedAt = props.completedAt ?? null;
  }

  get id(): string {
    return this._id;
  }

  get ticketId(): string {
    return this._ticketId;
  }

  get requestedWindowStart(): string | null {
    return this._requestedWindowStart;
  }

  get requestedWindowEnd(): string | null {
    return this._requestedWindowEnd;
  }

  get status(): VisitStatus {
    return this._status;
  }

  get completedAt(): string | null {
    return this._completedAt;
  }

  get isOpen(): boolean {
    return this._status === 'REQUESTED' || this._status === 'ASSIGNED';
  }

  get isCompleted(): boolean {
    return this._status === 'COMPLETED';
  }
}
