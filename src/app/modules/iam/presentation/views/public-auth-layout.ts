import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { APP_LANGUAGES, LanguageService } from '../../../../shared/application/language.service';

@Component({
  imports: [RouterOutlet, TranslatePipe],
  template: `
    <div class="language">
      <label for="public-language">{{ 'toolbar.language' | translate }}</label>
      <select id="public-language" [value]="language.lang()" (change)="select($event)">
        @for (option of languages; track option.code) {
          <option [value]="option.code" [attr.lang]="option.code">{{ option.label }}</option>
        }
      </select>
    </div>
    <router-outlet />
  `,
  styles: `
    :host { display: block; position: relative; }
    .language {
      position: absolute;
      z-index: 1;
      top: 1rem;
      inset-inline-end: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.65rem;
      border-radius: 0.5rem;
      background: Canvas;
      color: CanvasText;
    }
    select { font: inherit; color: inherit; background: inherit; }
    @media (max-width: 600px) {
      .language { position: relative; top: auto; inset-inline-end: auto; justify-content: flex-end; }
    }
  `,
})
export class PublicAuthLayout {
  protected readonly language = inject(LanguageService);
  protected readonly languages = APP_LANGUAGES;

  protected select(event: Event): void {
    const choice = (event.target as HTMLSelectElement).value;
    if (choice === 'en' || choice === 'es') this.language.set(choice);
  }
}
