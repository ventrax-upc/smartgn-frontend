import { Directive, inject } from '@angular/core';
import { MatSelect } from '@angular/material/select';

@Directive({
  selector: 'mat-select[smartgnSelect]',
  host: { class: 'smartgn-select' },
})
export class SmartgnSelect {
  constructor() {
    inject(MatSelect, { self: true }).panelClass = 'smartgn-select-panel';
  }
}
