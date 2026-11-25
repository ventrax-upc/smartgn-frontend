import { EmptyState, LoadingState } from '../../../../../shared/presentation/components/view-state';
import { pollWhileVisible } from '../../../../../shared/application/visible-polling';
import { TranslatePipe } from '@ngx-translate/core';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MetersStore } from '../../../application/meters.store';

@Component({
  selector: 'app-meters',
  imports: [EmptyState, LoadingState, TranslatePipe, RouterLink, MatIcon],
  templateUrl: './meters.html',
  styleUrl: './meters.css',
})
export class MetersPage implements OnInit {
  private readonly store = inject(MetersStore);

  protected readonly items = this.store.items;
  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;
  protected readonly count = this.store.count;
  protected readonly propertyCount = this.store.propertyCount;

  constructor() {
    pollWhileVisible(null, () => this.reload());
  }

  ngOnInit(): void {
    this.store.load();
  }

  private reload(): void {
    if (this.loading()) return;
    this.store.load();
  }
}
