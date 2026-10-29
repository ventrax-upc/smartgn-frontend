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
  imports: [ReactiveFormsModule, DatePipe, CurrencyPipe, RouterLink, MatIcon],
  templateUrl: './visits.html',
  styleUrl: './visits.css',
})
export class VisitsPage implements OnInit {
  private readonly store = inject(VisitsStore);
  private readonly techniciansStore = inject(TechniciansStore);
  private readonly authStore = inject(AuthStore);

  protected readonly items = this.store.items;
  protected readonly tickets = this.store.tickets;
  protected readonly loading = this.store.loading;
  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;
  protected readonly scheduledCount = this.store.scheduledCount;
  protected readonly completedCount = this.store.completedCount;
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

  ngOnInit(): void {
    this.store.load();
    if (this.isSuperAdmin()) {
      this.techniciansStore.load();
    }
  }

  protected reload(): void {
    this.store.load();
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
      this.formError.set('The end of the visit window must be after the start.');
      return;
    }

    this.store.requestVisit(value.ticketId ?? '', start, end, {
      onSuccess: () => {
        this.showForm.set(false);
        this.formError.set(null);
        this.success.set('Visit requested. A technician can now be assigned.');
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
        this.success.set('Technician assigned to the visit.');
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
          this.success.set('Visit completed. Its ticket is now resolved.');
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
    return status.toLowerCase();
  }

  private localDateTime(hoursFromNow: number): string {
    const date = new Date(Date.now() + hoursFromNow * 3_600_000);
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
  }
}
