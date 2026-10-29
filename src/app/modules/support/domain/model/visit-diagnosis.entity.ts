import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/*
  Mirrors VisitDiagnosis. Completing a visit with a diagnosis also marks the
  visit COMPLETED and the ticket RESOLVED in the backend.
*/
export class VisitDiagnosis implements BaseEntity {
  private readonly _id: string;
  private readonly _visitId: string;
  private readonly _summary: string;
  private readonly _finalCost: number;
  private readonly _billingReferenceId: string | null;
  private readonly _createdAt: string;

  constructor(props: {
    id: string;
    visitId: string;
    summary: string;
    finalCost: number;
    billingReferenceId?: string | null;
    createdAt: string;
  }) {
    this._id = props.id;
    this._visitId = props.visitId;
    this._summary = props.summary;
    this._finalCost = props.finalCost;
    this._billingReferenceId = props.billingReferenceId ?? null;
    this._createdAt = props.createdAt;
  }

  get id(): string {
    return this._id;
  }

  get visitId(): string {
    return this._visitId;
  }

  get summary(): string {
    return this._summary;
  }

  get finalCost(): number {
    return this._finalCost;
  }

  get billingReferenceId(): string | null {
    return this._billingReferenceId;
  }

  get createdAt(): string {
    return this._createdAt;
  }
}
