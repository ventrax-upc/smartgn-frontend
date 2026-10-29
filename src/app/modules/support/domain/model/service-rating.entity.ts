import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/*
  Mirrors ServiceRating. Rating a ticket also closes it in the backend, and a
  ticket can only have one rating.
*/
export class ServiceRating implements BaseEntity {
  private readonly _id: string;
  private readonly _ticketId: string;
  private readonly _score: number;
  private readonly _comment: string;
  private readonly _ratedAt: string;

  constructor(props: {
    id: string;
    ticketId: string;
    score: number;
    comment?: string;
    ratedAt: string;
  }) {
    this._id = props.id;
    this._ticketId = props.ticketId;
    this._score = props.score;
    this._comment = props.comment ?? '';
    this._ratedAt = props.ratedAt;
  }

  get id(): string {
    return this._id;
  }

  get ticketId(): string {
    return this._ticketId;
  }

  get score(): number {
    return this._score;
  }

  get comment(): string {
    return this._comment;
  }

  get ratedAt(): string {
    return this._ratedAt;
  }
}
