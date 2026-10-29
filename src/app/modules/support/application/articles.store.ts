import { Injectable, computed, inject, signal } from '@angular/core';
import { KnowledgeArticle } from '../domain/model/knowledge-article.entity';
import { SupportApi } from '../infrastructure/support-api';
import { ArticleInputResource } from '../infrastructure/support-response';

export type ArticleFilter = string;

/*
  The support-maintenance service exposes active knowledge articles at
  GET /support/articles and creation at POST /support/articles. Category is a
  free-form string, so filters are derived from the loaded data.
*/
@Injectable({ providedIn: 'root' })
export class ArticlesStore {
  private readonly api = inject(SupportApi);

  private readonly itemsSignal = signal<KnowledgeArticle[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  private readonly filterSignal = signal<ArticleFilter>('ALL');
  readonly filter = this.filterSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly savingSignal = signal(false);
  readonly saving = this.savingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly categories = computed<ArticleFilter[]>(() => {
    const unique = new Set(
      this.itemsSignal()
        .map((article) => article.category.trim())
        .filter((category) => category.length > 0),
    );
    return ['ALL', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  });

  readonly visibleItems = computed(() => {
    const filter = this.filterSignal();
    return filter === 'ALL'
      ? this.itemsSignal()
      : this.itemsSignal().filter((article) => article.category === filter);
  });

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getArticles().subscribe({
      next: (items) => {
        this.itemsSignal.set(items);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.messageFrom(err));
        this.loadingSignal.set(false);
      },
    });
  }

  setFilter(filter: ArticleFilter): void {
    this.filterSignal.set(filter);
  }

  create(
    input: ArticleInputResource,
    callbacks?: {
      onSuccess?: (article: KnowledgeArticle) => void;
      onError?: (message: string) => void;
    },
  ): void {
    this.savingSignal.set(true);
    this.api.createArticle(input).subscribe({
      next: (article) => {
        this.itemsSignal.update((items) => [article, ...items]);
        this.savingSignal.set(false);
        callbacks?.onSuccess?.(article);
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  private messageFrom(err: unknown): string {
    return err instanceof Error && err.message
      ? err.message
      : 'Could not load the help articles.';
  }
}
