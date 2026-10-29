import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { TechniciansStore } from './technicians.store';
import { TechnicianAssignment } from '../domain/model/technician-assignment.entity';
import { Ticket } from '../domain/model/ticket.entity';
import { VisitDiagnosis } from '../domain/model/visit-diagnosis.entity';
import { Visit } from '../domain/model/visit.entity';
import { SupportApi } from '../infrastructure/support-api';

interface StoreCallbacks<T> {
  onSuccess?: (value: T) => void;
  onError?: (message: string) => void;
}

/*
  The support-maintenance service only exposes visits per ticket
  (GET /support/tickets/{ticketId}/visits). This store enumerates the tickets
  first and flattens their visits so the SPA can still offer a visit overview.
*/
@Injectable({ providedIn: 'root' })
export class VisitsStore {
  private readonly api = inject(SupportApi);
  private readonly techniciansStore = inject(TechniciansStore);

  private readonly itemsSignal = signal<Visit[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  private readonly ticketsSignal = signal<Ticket[]>([]);
  readonly tickets = this.ticketsSignal.asReadonly();

  private readonly diagnosesSignal = signal<Record<string, VisitDiagnosis>>({});
  readonly diagnoses = this.diagnosesSignal.asReadonly();

  private readonly assignmentsSignal = signal<Record<string, TechnicianAssignment>>({});
  readonly assignments = this.assignmentsSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly savingSignal = signal(false);
  readonly saving = this.savingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly scheduledCount = computed(
    () => this.itemsSignal().filter((visit) => visit.isOpen).length,
  );
  readonly completedCount = computed(
    () => this.itemsSignal().filter((visit) => visit.status === 'COMPLETED').length,
  );

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.getTickets().subscribe({
      next: (tickets) => {
        this.ticketsSignal.set(tickets);
        if (tickets.length === 0) {
          this.itemsSignal.set([]);
          this.loadingSignal.set(false);
          return;
        }

        forkJoin(tickets.map((ticket) => this.api.getVisits(ticket.id))).subscribe({
          next: (groups) => {
            const visits = groups.flat();
            this.itemsSignal.set(visits);
            this.loadingSignal.set(false);
            this.loadCompletedDiagnoses(visits);
          },
          error: (err) => {
            this.errorSignal.set(this.messageFrom(err));
            this.loadingSignal.set(false);
          },
        });
      },
      error: (err) => {
        this.errorSignal.set(this.messageFrom(err));
        this.loadingSignal.set(false);
      },
    });
  }

  loadForTicket(ticketId: string): void {
    this.api.getVisits(ticketId).subscribe({
      next: (visits) => {
        this.merge(visits);
        this.loadCompletedDiagnoses(visits);
      },
      error: (err) => this.errorSignal.set(this.messageFrom(err)),
    });
  }

  requestVisit(
    ticketId: string,
    requestedWindowStart: string,
    requestedWindowEnd: string,
    callbacks?: StoreCallbacks<Visit>,
  ): void {
    this.savingSignal.set(true);
    this.api
      .requestVisit(ticketId, { requestedWindowStart, requestedWindowEnd })
      .subscribe({
        next: (visit) => {
          this.merge([visit]);
          this.updateTicketStatus(ticketId, 'VISIT_REQUESTED', null);
          this.savingSignal.set(false);
          callbacks?.onSuccess?.(visit);
        },
        error: (err) => {
          this.savingSignal.set(false);
          callbacks?.onError?.(this.messageFrom(err));
        },
      });
  }

  assignTechnician(
    visitId: string,
    technicianId: string,
    callbacks?: StoreCallbacks<TechnicianAssignment>,
  ): void {
    this.savingSignal.set(true);
    this.api.assignTechnician(visitId, { technicianId }).subscribe({
      next: (assignment) => {
        this.assignmentsSignal.update((current) => ({
          ...current,
          [visitId]: assignment,
        }));
        this.updateVisit(visitId, 'ASSIGNED', null);
        this.savingSignal.set(false);
        this.techniciansStore.load();
        callbacks?.onSuccess?.(assignment);
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  completeVisit(
    visitId: string,
    summary: string,
    finalCost: number,
    callbacks?: StoreCallbacks<VisitDiagnosis>,
  ): void {
    this.savingSignal.set(true);
    this.api.completeVisit(visitId, { summary, finalCost }).subscribe({
      next: (diagnosis) => {
        this.diagnosesSignal.update((current) => ({
          ...current,
          [visitId]: diagnosis,
        }));
        const completedAt = new Date().toISOString();
        this.updateVisit(visitId, 'COMPLETED', completedAt);
        const visit = this.itemsSignal().find((item) => item.id === visitId);
        if (visit) this.updateTicketStatus(visit.ticketId, 'RESOLVED', completedAt);
        this.savingSignal.set(false);
        callbacks?.onSuccess?.(diagnosis);
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  visitsFor(ticketId: string): Visit[] {
    return this.itemsSignal().filter((visit) => visit.ticketId === ticketId);
  }

  ticketFor(ticketId: string): Ticket | undefined {
    return this.ticketsSignal().find((ticket) => ticket.id === ticketId);
  }

  diagnosisFor(visitId: string): VisitDiagnosis | null {
    return this.diagnosesSignal()[visitId] ?? null;
  }

  assignmentFor(visitId: string): TechnicianAssignment | null {
    return this.assignmentsSignal()[visitId] ?? null;
  }

  private merge(visits: Visit[]): void {
    this.itemsSignal.update((current) => {
      const byId = new Map(current.map((visit) => [visit.id, visit]));
      visits.forEach((visit) => byId.set(visit.id, visit));
      return [...byId.values()].sort((a, b) =>
        (b.requestedWindowStart ?? '').localeCompare(a.requestedWindowStart ?? ''),
      );
    });
  }

  private updateVisit(
    visitId: string,
    status: Visit['status'],
    completedAt: string | null,
  ): void {
    this.itemsSignal.update((items) =>
      items.map((visit) =>
        visit.id === visitId
          ? new Visit({
              id: visit.id,
              ticketId: visit.ticketId,
              requestedWindowStart: visit.requestedWindowStart,
              requestedWindowEnd: visit.requestedWindowEnd,
              status,
              completedAt: completedAt ?? visit.completedAt,
            })
          : visit,
      ),
    );
  }

  private updateTicketStatus(
    ticketId: string,
    status: Ticket['status'],
    resolvedAt: string | null,
  ): void {
    this.ticketsSignal.update((tickets) =>
      tickets.map((ticket) =>
        ticket.id === ticketId
          ? new Ticket({
              id: ticket.id,
              principalAccountId: ticket.principalAccountId,
              meterId: ticket.meterId,
              subject: ticket.subject,
              message: ticket.message,
              status,
              createdAt: ticket.createdAt,
              resolvedAt: resolvedAt ?? ticket.resolvedAt,
              closedAt: ticket.closedAt,
            })
          : ticket,
      ),
    );
  }

  private loadCompletedDiagnoses(visits: Visit[]): void {
    visits
      .filter((visit) => visit.isCompleted && !this.diagnosesSignal()[visit.id])
      .forEach((visit) => {
        this.api.getDiagnosis(visit.id).subscribe({
          next: (diagnosis) => {
            if (!diagnosis) return;
            this.diagnosesSignal.update((current) => ({
              ...current,
              [visit.id]: diagnosis,
            }));
          },
          error: () => undefined,
        });
      });
  }

  private messageFrom(err: unknown): string {
    return err instanceof Error && err.message
      ? err.message
      : 'Could not complete the operation.';
  }
}
