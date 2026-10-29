import { BaseEntity } from '../../../../shared/domain/model/base-entity';

/*
  Mirrors KnowledgeArticle. The support service exposes GET /support/articles
  (active articles) and POST /support/articles. The category is a free-form
  string in the backend, so the UI derives its filters from the data.
*/
export class KnowledgeArticle implements BaseEntity {
  private readonly _id: string;
  private readonly _title: string;
  private readonly _category: string;
  private readonly _contentReference: string;
  private readonly _publishedAt: string | null;
  private readonly _active: boolean;

  constructor(props: {
    id: string;
    title: string;
    category: string;
    contentReference: string;
    publishedAt?: string | null;
    active: boolean;
  }) {
    this._id = props.id;
    this._title = props.title;
    this._category = props.category;
    this._contentReference = props.contentReference;
    this._publishedAt = props.publishedAt ?? null;
    this._active = props.active;
  }

  get id(): string {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  get category(): string {
    return this._category;
  }

  get contentReference(): string {
    return this._contentReference;
  }

  get publishedAt(): string | null {
    return this._publishedAt;
  }

  get active(): boolean {
    return this._active;
  }

  get isUrl(): boolean {
    return /^https?:\/\//i.test(this._contentReference);
  }
}
