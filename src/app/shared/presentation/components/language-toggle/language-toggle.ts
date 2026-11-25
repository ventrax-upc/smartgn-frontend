import { Component, computed, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../../application/language.service';

@Component({
  selector: 'app-language-toggle',
  imports: [MatIconButton, MatIcon, TranslatePipe],
  template: `
    <button mat-icon-button type="button"
      [attr.aria-label]="label() | translate"
      [title]="label() | translate"
      (click)="language.toggle()">
      <mat-icon>translate</mat-icon>
    </button>
  `,
  styles: `
    :host { display: inline-flex; }
    button { color: var(--smartgn-muted); }
    button:hover { color: var(--smartgn-primary); background: var(--smartgn-hover); }
    button:focus-visible { outline: 2px solid var(--smartgn-primary); outline-offset: 2px; }
  `,
})
export class LanguageToggle {
  protected readonly language = inject(LanguageService);
  protected readonly label = computed(() =>
    this.language.lang() === 'en' ? 'ui.switchToSpanish' : 'ui.switchToEnglish',
  );
}
