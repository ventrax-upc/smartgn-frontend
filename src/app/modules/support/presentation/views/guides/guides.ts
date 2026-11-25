import { FormDialog } from '../../../../../shared/presentation/components/form-dialog';
import { EmptyState, LoadingState } from '../../../../../shared/presentation/components/view-state';
import { pollWhileVisible } from '../../../../../shared/application/visible-polling';
import { LanguageService } from '../../../../../shared/application/language.service';
import { TranslatePipe } from '@ngx-translate/core';
import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ArticlesStore, ArticleFilter } from '../../../application/articles.store';
import { AuthStore } from '../../../../iam/application/auth.store';

@Component({
  selector: 'app-guides',
  imports: [FormDialog, EmptyState, LoadingState, TranslatePipe, ReactiveFormsModule, DatePipe, MatIcon],
  templateUrl: './guides.html',
  styleUrl: './guides.css',
})
export class GuidesPage implements OnInit {
  protected readonly safetyGuides = [
    { title: 'ui.guideAlertTitle', body: 'ui.guideAlertBody' },
    { title: 'ui.guideReadingTitle', body: 'ui.guideReadingBody' },
    { title: 'ui.guideMeterTitle', body: 'ui.guideMeterBody' },
    { title: 'ui.guideDeliveryTitle', body: 'ui.guideDeliveryBody' },
  ];

  protected readonly lang = inject(LanguageService).lang;
  private readonly store = inject(ArticlesStore);
  private readonly authStore = inject(AuthStore);

  protected readonly items = this.store.visibleItems;
  protected readonly loading = this.store.loading;
  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;
  protected readonly categories = this.store.categories;
  protected readonly activeFilter = this.store.filter;
  protected readonly isSuperAdmin = this.authStore.isSuperAdmin;
  protected readonly showForm = signal(false);
  protected readonly success = signal<string | null>(null);

  protected readonly form = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.maxLength(180)]),
    category: new FormControl('', [Validators.required, Validators.maxLength(80)]),
    contentReference: new FormControl('', [Validators.required, Validators.maxLength(500)]),
  });

  constructor() {
    pollWhileVisible(null, () => this.reload());
  }

  ngOnInit(): void {
    this.store.load();
  }

  private reload(): void {
    if (this.loading() || this.showForm() || this.saving()) return;
    this.store.load();
  }

  protected filter(category: ArticleFilter): void {
    this.store.setFilter(category);
  }

  protected startCreate(): void {
    this.form.reset({ title: '', category: '', contentReference: '' });
    this.showForm.set(true);
    this.success.set(null);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.store.create(
      {
        title: value.title?.trim() ?? '',
        category: value.category?.trim() ?? '',
        contentReference: value.contentReference?.trim() ?? '',
      },
      {
        onSuccess: () => {
          this.showForm.set(false);
          this.success.set('ui.articlePublishedToTheHelpCenter');
        },
      },
    );
  }

  protected categoryLabel(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
}
