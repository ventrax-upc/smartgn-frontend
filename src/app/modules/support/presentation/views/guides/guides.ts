import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ArticlesStore, ArticleFilter } from '../../../application/articles.store';
import { AuthStore } from '../../../../iam/application/auth.store';

@Component({
  selector: 'app-guides',
  imports: [ReactiveFormsModule, DatePipe, MatIcon],
  templateUrl: './guides.html',
  styleUrl: './guides.css',
})
export class GuidesPage implements OnInit {
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

  ngOnInit(): void {
    this.store.load();
  }

  protected reload(): void {
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
          this.success.set('Article published to the help center.');
        },
      },
    );
  }

  protected categoryLabel(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
}
