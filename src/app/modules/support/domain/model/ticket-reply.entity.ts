import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/*
  Mirrors TicketReply from the support-maintenance service. Replies are a
  separate resource, retrieved with GET /support/tickets/{id}/replies.
*/
export class TicketReply implements BaseEntity {
  private readonly _id: string;
  private readonly _ticketId: string;
  private readonly _authorAccountId: string;
  private readonly _body: string;
  private readonly _postedAt: string;

  constructor(props: {
    id: string;
    ticketId: string;
    authorAccountId: string;
    body: string;
    postedAt: string;
  }) {
    this._id = props.id;
    this._ticketId = props.ticketId;
    this._authorAccountId = props.authorAccountId;
    this._body = props.body;
    this._postedAt = props.postedAt;
  }

  get id(): string {
    return this._id;
  }

  get ticketId(): string {
    return this._ticketId;
  }

  get authorAccountId(): string {
    return this._authorAccountId;
  }

  get body(): string {
    return this._body;
  }

  get postedAt(): string {
    return this._postedAt;
  }
}
