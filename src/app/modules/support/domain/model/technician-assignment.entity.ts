import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/*
  Mirrors TechnicianAssignment. The backend returns this resource when a
  technician is assigned, but does not expose a GET collection for assignments.
*/
export class TechnicianAssignment implements BaseEntity {
  private readonly _id: string;
  private readonly _visitId: string;
  private readonly _technicianId: string;
  private readonly _assignedAt: string;
  private readonly _active: boolean;

  constructor(props: {
    id: string;
    visitId: string;
    technicianId: string;
    assignedAt: string;
    active: boolean;
  }) {
    this._id = props.id;
    this._visitId = props.visitId;
    this._technicianId = props.technicianId;
    this._assignedAt = props.assignedAt;
    this._active = props.active;
  }

  get id(): string {
    return this._id;
  }

  get visitId(): string {
    return this._visitId;
  }

  get technicianId(): string {
    return this._technicianId;
  }

  get assignedAt(): string {
    return this._assignedAt;
  }

  get active(): boolean {
    return this._active;
  }
}
