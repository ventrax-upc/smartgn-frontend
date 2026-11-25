import { Component, computed, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'button[appPasswordToggle]',
  imports: [MatIcon, TranslatePipe],
  host: { type: 'button' },
  styles: [`
    :host(.toggle-visibility) mat-icon { width: 20px; height: 20px; font-size: 20px; }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `],
  template: `
    <mat-icon aria-hidden="true">{{ visible() ? 'visibility_off' : 'visibility' }}</mat-icon>
    <span [class.visually-hidden]="!withLabel()">{{ labelKey() | translate }}</span>
  `,
})
export class PasswordToggle {
  readonly visible = input.required<boolean>();
  readonly withLabel = input(false);
  readonly labelKey = computed(() => this.visible()
    ? (this.withLabel() ? 'ui.hidePasswords' : 'ui.hidePassword')
    : (this.withLabel() ? 'ui.showPasswords' : 'ui.showPassword'));
}
