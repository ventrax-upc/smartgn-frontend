import {
  afterNextRender,
  DestroyRef,
  Directive,
  inject,
  output,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';

@Directive({ selector: 'ng-template[appFormDialog]' })
export class FormDialog {
  readonly dismissed = output<void>();

  constructor() {
    const dialog = inject(MatDialog);
    const template = inject<TemplateRef<unknown>>(TemplateRef);
    const viewContainerRef = inject(ViewContainerRef);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const ref = dialog.open(template, {
        viewContainerRef,
        width: '520px',
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100dvh - 32px)',
        ariaLabelledBy: 'secondary-form-title',
        panelClass: 'secondary-form-overlay',
      });
      ref.afterClosed().pipe(takeUntilDestroyed(destroyRef)).subscribe(() => this.dismissed.emit());
      destroyRef.onDestroy(() => ref.close());
    });
  }
}
