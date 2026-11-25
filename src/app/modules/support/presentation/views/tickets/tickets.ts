import { FormDialog } from '../../../../../shared/presentation/components/form-dialog';
import { SmartgnSelect } from '../../../../../shared/presentation/components/smartgn-select';
import { EmptyState, LoadingState } from '../../../../../shared/presentation/components/view-state';
import { MatSelectModule } from '@angular/material/select';
import { pollWhileVisible } from '../../../../../shared/application/visible-polling';
import { LanguageService } from '../../../../../shared/application/language.service';
import { TranslatePipe } from '@ngx-translate/core';
import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { TicketsStore, TicketFilter } from '../../../application/tickets.store';
import { Ticket, TicketStatus } from '../../../domain/model/ticket.entity';
import { MetersStore } from '../../../../installation/application/meters.store';
import { AuthStore } from '../../../../iam/application/auth.store';

@Component({
  selector: 'app-tickets',
  imports: [FormDialog, SmartgnSelect, EmptyState, LoadingState, MatSelectModule, TranslatePipe, ReactiveFormsModule, DatePipe, SlicePipe, RouterLink, MatIcon],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class TicketsPage implements OnInit {
  protected readonly lang = inject(LanguageService).lang;
  private readonly store = inject(TicketsStore);
  private readonly metersStore = inject(MetersStore);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly items = this.store.visibleItems;
  protected readonly loading = this.store.loading;
  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;
  protected readonly statuses = this.store.statuses;
  protected readonly activeFilter = this.store.filter;
  protected readonly openCount = this.store.openCount;
  protected readonly resolvedCount = this.store.resolvedCount;
  protected readonly isSuperAdmin = this.authStore.isSuperAdmin;
  protected readonly meters = this.metersStore.items;
  protected readonly showForm = signal(false);
  protected readonly success = signal<string | null>(null);

  protected readonly form = new FormGroup({
    meterId: new FormControl('', [Validators.required]),
    subject: new FormControl('', [Validators.required, Validators.maxLength(180)]),
    message: new FormControl('', [Validators.required, Validators.maxLength(4000)]),
  });

  constructor() {
    pollWhileVisible(30000, () => this.reload());
  }

  ngOnInit(): void {
    this.store.load();
    if (!this.isSuperAdmin()) {
      this.metersStore.load();
      const meterId =
        this.route.snapshot.queryParamMap.get('meterId') ??
        this.route.snapshot.queryParamMap.get('pointId');
      if (meterId) {
        this.form.patchValue({ meterId });
        this.showForm.set(true);
      }
    }
  }

  private reload(): void {
    if (this.loading() || this.showForm() || this.saving()) return;
    this.store.load();
  }

  protected filter(status: TicketFilter): void {
    this.store.setFilter(status);
  }

  protected startCreate(): void {
    this.form.reset({ meterId: '', subject: '', message: '' });
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
        meterId: value.meterId ?? '',
        subject: value.subject?.trim() ?? '',
        message: value.message?.trim() ?? '',
      },
      {
        onSuccess: (ticket) => {
          this.showForm.set(false);
          this.success.set('ui.ticketOpenedOurTeamWillReplyShortly');
          this.router.navigate(['/support/tickets', ticket.id]);
        },
      },
    );
  }

  protected meterLabel(ticket: Ticket): string {
    const meter = this.meters().find((item) => item.id === ticket.meterId);
    return meter?.displayName ?? ticket.meterId;
  }

  protected statusLabel(status: TicketStatus): string {
    return 'supportStatus.' + status;
  }
}
