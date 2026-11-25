import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, fromEvent, interval, of, startWith, switchMap, timer } from 'rxjs';

export function pollWhileVisible(milliseconds: number | null, refresh: () => void): void {
  const document = inject(DOCUMENT);
  const destroyRef = inject(DestroyRef);

  fromEvent(document, 'visibilitychange').pipe(
    startWith(null),
    switchMap((event) => {
      if (document.hidden) return EMPTY;
      // The page loads its initial data separately. Refresh immediately on return.
      if (milliseconds === null) return event ? of(0) : EMPTY;
      return event ? timer(0, milliseconds) : interval(milliseconds);
    }),
    takeUntilDestroyed(destroyRef),
  ).subscribe(refresh);
}
