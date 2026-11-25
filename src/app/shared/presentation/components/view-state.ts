import { Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-empty-state',
  imports: [MatIcon, TranslatePipe],
  host: { class: 'empty' },
  template: `
    <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
    <span class="empty-title">{{ titleKey() | translate }}</span>
    @if (descriptionKey(); as key) {
      <span class="empty-text">{{ key | translate }}</span>
    }
  `,
})
export class EmptyState {
  readonly icon = input.required<string>();
  readonly titleKey = input.required<string>();
  readonly descriptionKey = input<string>();
}

@Component({
  selector: 'app-loading-state',
  imports: [TranslatePipe],
  host: { class: 'loading-row', role: 'status' },
  template: `
    <span class="spinner" aria-hidden="true"></span>
    {{ messageKey() | translate }}
  `,
})
export class LoadingState {
  readonly messageKey = input.required<string>();
}
