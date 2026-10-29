import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/*
  Mirrors TicketPhoto. The backend stores an object reference (for example a
  storage key or URL), not the binary file itself.
*/
export class TicketPhoto implements BaseEntity {
  private readonly _id: string;
  private readonly _ticketId: string;
  private readonly _objectReference: string;
  private readonly _uploadedByAccountId: string;
  private readonly _uploadedAt: string;

  constructor(props: {
    id: string;
    ticketId: string;
    objectReference: string;
    uploadedByAccountId: string;
    uploadedAt: string;
  }) {
    this._id = props.id;
    this._ticketId = props.ticketId;
    this._objectReference = props.objectReference;
    this._uploadedByAccountId = props.uploadedByAccountId;
    this._uploadedAt = props.uploadedAt;
  }

  get id(): string {
    return this._id;
  }

  get ticketId(): string {
    return this._ticketId;
  }

  get objectReference(): string {
    return this._objectReference;
  }

  get uploadedByAccountId(): string {
    return this._uploadedByAccountId;
  }

  get uploadedAt(): string {
    return this._uploadedAt;
  }

  get isUrl(): boolean {
    return /^https?:\/\//i.test(this._objectReference);
  }
}
