import { FormDialog } from '../../../../../shared/presentation/components/form-dialog';
import { SmartgnSelect } from '../../../../../shared/presentation/components/smartgn-select';
import { EmptyState, LoadingState } from '../../../../../shared/presentation/components/view-state';
import { MatSelectModule } from '@angular/material/select';
import { pollWhileVisible } from '../../../../../shared/application/visible-polling';
import { LanguageService } from '../../../../../shared/application/language.service';
import { TranslatePipe } from '@ngx-translate/core';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { VisitsStore } from '../../../application/visits.store';
import { TechniciansStore } from '../../../application/technicians.store';
import { Ticket } from '../../../domain/model/ticket.entity';
import { Visit, VisitStatus } from '../../../domain/model/visit.entity';
import { AuthStore } from '../../../../iam/application/auth.store';

@Component({
  selector: 'app-visits',
  imports: [FormDialog, SmartgnSelect, EmptyState, LoadingState, MatSelectModule, TranslatePipe, ReactiveFormsModule, DatePipe, CurrencyPipe, RouterLink, MatIcon],
  templateUrl: './visits.html',
  styleUrl: './visits.css',
})
export class VisitsPage implements OnInit {
  protected readonly lang = inject(LanguageService).lang;
  protected readonly store = inject(VisitsStore);
  private readonly techniciansStore = inject(TechniciansStore);
  private readonly authStore = inject(AuthStore);

  protected readonly items = this.store.items;
  protected readonly tickets = this.store.tickets;
  protected readonly loading = this.store.loading;
  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;
  protected readonly scheduledCount = this.store.scheduledCount;
  protected readonly completedCount = this.store.completedCount;
  protected readonly isDelegated = this.authStore.isDelegated;
  protected readonly isSuperAdmin = this.authStore.isSuperAdmin;
  protected readonly technicians = this.techniciansStore.items;

  protected readonly showForm = signal(false);
  protected readonly success = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly diagnosingVisitId = signal<string | null>(null);
  protected readonly technicianSelection = signal<Record<string, string>>({});
  protected readonly assignedNames = signal<Record<string, string>>({});

  protected readonly requestableTickets = computed(() =>
    this.tickets().filter(
      (ticket) =>
        !ticket.isClosed &&
        !this.items().some((visit) => visit.ticketId === ticket.id && visit.isOpen),
    ),
  );

  protected readonly form = new FormGroup({
    ticketId: new FormControl('', [Validators.required]),
    requestedWindowStart: new FormControl(this.localDateTime(24), [Validators.required]),
    requestedWindowEnd: new FormControl(this.localDateTime(26), [Validators.required]),
  });

  protected readonly diagnosisForm = new FormGroup({
    summary: new FormControl('', [Validators.required, Validators.maxLength(2000)]),
    finalCost: new FormControl(0, [Validators.required, Validators.min(0)]),
  });

  constructor() {
    pollWhileVisible(null, () => this.reload());
  }

  ngOnInit(): void {
    this.store.load(undefined, true, this.isDelegated());
    if (this.isSuperAdmin()) {
      this.techniciansStore.load();
    }
  }

  private reload(): void {
    if (this.loading() || this.showForm() || this.saving() || this.diagnosingVisitId()) return;
    this.store.load(undefined, true, this.isDelegated());
  }

  protected startCreate(): void {
    this.form.reset({
      ticketId: '',
      requestedWindowStart: this.localDateTime(24),
      requestedWindowEnd: this.localDateTime(26),
    });
    this.formError.set(null);
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
    const start = value.requestedWindowStart ?? '';
    const end = value.requestedWindowEnd ?? '';
    if (!start || !end || new Date(end) <= new Date(start)) {
      this.formError.set('ui.theEndOfTheVisitWindowMust');
      return;
    }

    this.store.requestVisit(value.ticketId ?? '', start, end, {
      onSuccess: () => {
        this.showForm.set(false);
        this.formError.set(null);
        this.success.set('ui.visitRequestedATechnicianCanNowBe');
      },
      onError: (message) => this.formError.set(message),
    });
  }

  protected setTechnician(visitId: string, technicianId: string): void {
    this.technicianSelection.update((current) => ({ ...current, [visitId]: technicianId }));
  }

  protected assign(visit: Visit): void {
    const technicianId = this.technicianSelection()[visit.id];
    if (!technicianId) return;
    const technician = this.technicians().find((item) => item.id === technicianId);
    this.store.assignTechnician(visit.id, technicianId, {
      onSuccess: () => {
        if (technician) {
          this.assignedNames.update((current) => ({
            ...current,
            [visit.id]: technician.fullName,
          }));
        }
        this.success.set('ui.technicianAssignedToTheVisit');
      },
    });
  }

  protected startDiagnosis(visitId: string): void {
    this.diagnosisForm.reset({ summary: '', finalCost: 0 });
    this.diagnosingVisitId.set(visitId);
  }

  protected cancelDiagnosis(): void {
    this.diagnosingVisitId.set(null);
  }

  protected complete(visit: Visit): void {
    if (this.diagnosisForm.invalid) {
      this.diagnosisForm.markAllAsTouched();
      return;
    }
    const value = this.diagnosisForm.getRawValue();
    this.store.completeVisit(
      visit.id,
      value.summary?.trim() ?? '',
      Number(value.finalCost ?? 0),
      {
        onSuccess: () => {
          this.diagnosingVisitId.set(null);
          this.success.set('ui.visitCompletedItsTicketIsNowResolved');
        },
      },
    );
  }

  protected ticketFor(ticketId: string): Ticket | undefined {
    return this.store.ticketFor(ticketId);
  }

  protected diagnosisFor(visit: Visit) {
    return this.store.diagnosisFor(visit.id);
  }

  protected technicianName(visit: Visit): string {
    const local = this.assignedNames()[visit.id];
    if (local) return local;
    const assignment = this.store.assignmentFor(visit.id);
    if (!assignment) return '';
    return (
      this.technicians().find((technician) => technician.id === assignment.technicianId)?.fullName ??
      assignment.technicianId
    );
  }

  protected statusLabel(status: VisitStatus): string {
    return 'supportStatus.' + status;
  }

  private localDateTime(hoursFromNow: number): string {
    const date = new Date(Date.now() + hoursFromNow * 3_600_000);
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
  }
}
