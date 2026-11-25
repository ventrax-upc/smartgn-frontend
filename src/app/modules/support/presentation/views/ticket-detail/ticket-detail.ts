import { FormDialog } from '../../../../../shared/presentation/components/form-dialog';
import { SmartgnSelect } from '../../../../../shared/presentation/components/smartgn-select';
import { LoadingState } from '../../../../../shared/presentation/components/view-state';
import { MatSelectModule } from '@angular/material/select';
import { LanguageService } from '../../../../../shared/application/language.service';
import { TranslatePipe } from '@ngx-translate/core';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { TicketsStore } from '../../../application/tickets.store';
import { TechniciansStore } from '../../../application/technicians.store';
import { VisitsStore } from '../../../application/visits.store';
import { TicketReply } from '../../../domain/model/ticket-reply.entity';
import { TicketStatus } from '../../../domain/model/ticket.entity';
import { Visit, VisitStatus } from '../../../domain/model/visit.entity';
import { AuthStore } from '../../../../iam/application/auth.store';

@Component({
  selector: 'app-ticket-detail',
  imports: [FormDialog, SmartgnSelect, LoadingState, MatSelectModule, TranslatePipe, ReactiveFormsModule, DatePipe, CurrencyPipe, RouterLink, MatIcon],
  templateUrl: './ticket-detail.html',
  styleUrl: './ticket-detail.css',
})
export class TicketDetailPage implements OnInit {
  protected readonly lang = inject(LanguageService).lang;
  private readonly store = inject(TicketsStore);
  private readonly techniciansStore = inject(TechniciansStore);
  protected readonly visitsStore = inject(VisitsStore);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  protected readonly ticket = this.store.selected;
  protected readonly loading = this.store.detailLoading;
  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;
  protected readonly replies = this.store.replies;
  protected readonly photos = this.store.photos;
  protected readonly rating = this.store.rating;
  protected readonly isSuperAdmin = this.authStore.isSuperAdmin;
  protected readonly isPrincipal = this.authStore.isPrincipalUser;
  protected readonly currentUser = this.authStore.currentUser;
  protected readonly technicians = this.techniciansStore.items;
  protected readonly success = signal<string | null>(null);

  protected readonly visitAccess = signal<'pending' | 'allowed' | 'denied' | 'unavailable'>('pending');

  protected readonly visits = computed(() => {
    const current = this.ticket();
    return current ? this.visitsStore.visitsFor(current.id) : [];
  });
  protected readonly hasOpenVisit = computed(() => this.visits().some((visit) => visit.isOpen));

  protected readonly replyForm = new FormGroup({
    body: new FormControl('', [Validators.required, Validators.maxLength(4000)]),
  });
  protected readonly visitForm = new FormGroup({
    requestedWindowStart: new FormControl('', [Validators.required]),
    requestedWindowEnd: new FormControl('', [Validators.required]),
  });
  protected readonly ratingForm = new FormGroup({
    score: new FormControl(5, [Validators.required, Validators.min(1), Validators.max(5)]),
    comment: new FormControl('', [Validators.maxLength(1000)]),
  });
  protected readonly showPhotoForm = signal(false);
  protected readonly showVisitForm = signal(false);
  protected readonly showRatingForm = signal(false);

  protected readonly diagnosisForm = new FormGroup({
    summary: new FormControl('', [Validators.required, Validators.maxLength(2000)]),
    finalCost: new FormControl(0, [Validators.required, Validators.min(0)]),
  });

  protected readonly diagnosingVisitId = signal<string | null>(null);
  protected readonly technicianSelection = signal<Record<string, string>>({});
  protected readonly assignedNames = signal<Record<string, string>>({});

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.visitAccess.set('pending');
      this.showVisitForm.set(false);
      this.store.loadTicket(id, (ticket) => {
        if (this.route.snapshot.paramMap.get('id') !== id) return;
        if (!this.authStore.isDelegated()) {
          this.visitAccess.set('allowed');
          this.visitsStore.loadForTicket(id);
          return;
        }
        this.visitsStore.eligibleTickets([ticket]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (eligible) => {
            if (this.route.snapshot.paramMap.get('id') !== id) return;
            this.visitAccess.set(eligible.length ? 'allowed' : 'denied');
            if (eligible.length) this.visitsStore.loadForTicket(id);
          },
          error: () => {
            if (this.route.snapshot.paramMap.get('id') === id) this.visitAccess.set('unavailable');
          },
        });
      });
    });

    if (this.isSuperAdmin()) {
      this.techniciansStore.load();
    }
  }

  protected sendReply(): void {
    const current = this.ticket();
    if (!current) return;
    if (this.replyForm.invalid) {
      this.replyForm.markAsTouched();
      return;
    }
    const body = this.replyForm.controls.body.value?.trim() ?? '';
    if (!body) return;
    this.store.sendReply(current.id, body, {
      onSuccess: () => {
        this.replyForm.reset({ body: '' });
        this.success.set('ui.replySent');
      },
    });
  }

  protected addPhoto(input: HTMLInputElement): void {
    const current = this.ticket();
    const file = input.files?.[0];
    if (!current || !file) return;
    this.success.set(null);
    this.store.addPhoto(current.id, file, {
      onSuccess: () => {
        this.showPhotoForm.set(false);
        this.success.set('ui.photoAttached');
      },
    });
  }

  protected requestVisit(): void {
    const current = this.ticket();
    if (!current || this.visitAccess() !== 'allowed') return;
    if (this.visitForm.invalid) {
      this.visitForm.markAllAsTouched();
      return;
    }
    const value = this.visitForm.getRawValue();
    const start = value.requestedWindowStart ?? '';
    const end = value.requestedWindowEnd ?? '';
    if (!start || !end || new Date(end) <= new Date(start)) {
      this.success.set(null);
      this.visitForm.controls.requestedWindowEnd.setErrors({ invalidWindow: true });
      return;
    }

    this.visitsStore.requestVisit(current.id, start, end, {
      onSuccess: () => {
        this.showVisitForm.set(false);
        this.visitForm.reset({ requestedWindowStart: '', requestedWindowEnd: '' });
        this.store.loadTicket(current.id);
        this.visitsStore.loadForTicket(current.id);
        this.success.set('ui.visitRequestedOurTeamWillConfirmThe');
      },
    });
  }

  protected setTechnician(visitId: string, technicianId: string): void {
    this.technicianSelection.update((current) => ({ ...current, [visitId]: technicianId }));
  }

  protected assignTechnician(visit: Visit): void {
    const technicianId = this.technicianSelection()[visit.id];
    if (!technicianId) return;
    const technician = this.technicians().find((item) => item.id === technicianId);
    this.visitsStore.assignTechnician(visit.id, technicianId, {
      onSuccess: () => {
        if (technician) {
          this.assignedNames.update((current) => ({
            ...current,
            [visit.id]: technician.fullName,
          }));
        }
        this.success.set('ui.technicianAssigned');
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

  protected completeVisit(visit: Visit): void {
    if (this.diagnosisForm.invalid) {
      this.diagnosisForm.markAllAsTouched();
      return;
    }
    const value = this.diagnosisForm.getRawValue();
    this.visitsStore.completeVisit(visit.id, value.summary?.trim() ?? '', Number(value.finalCost ?? 0), {
      onSuccess: () => {
        this.diagnosingVisitId.set(null);
        const current = this.ticket();
        if (current) {
          this.store.loadTicket(current.id);
          this.visitsStore.loadForTicket(current.id);
        }
        this.success.set('ui.visitCompletedAndTheTicketMarkedAs');
      },
    });
  }

  protected closeTicket(): void {
    const current = this.ticket();
    if (!this.isPrincipal() || current?.status !== 'RESOLVED') return;
    this.store.close(current, {
      onSuccess: () => this.success.set('ui.ticketClosed'),
    });
  }

  protected submitRating(): void {
    const current = this.ticket();
    if (!this.isPrincipal() || !current?.canBeRated) return;
    if (this.ratingForm.invalid) {
      this.ratingForm.markAllAsTouched();
      return;
    }
    const value = this.ratingForm.getRawValue();
    this.store.submitRating(current.id, Number(value.score ?? 5), value.comment?.trim() ?? '', {
      onSuccess: () => {
        this.showRatingForm.set(false);
        this.success.set('ui.thanksForRatingTheService');
      },
    });
  }

  protected statusLabel(status: TicketStatus | VisitStatus): string {
    return 'supportStatus.' + status;
  }

  protected authorLabel(reply: TicketReply): string {
    if (reply.authorAccountId === this.currentUser()?.id) return 'ui.you';
    return this.isSuperAdmin() ? 'ui.customer' : 'ui.supportTeam';
  }

  protected technicianName(visit: Visit): string {
    const local = this.assignedNames()[visit.id];
    if (local) return local;
    const assignment = this.visitsStore.assignmentFor(visit.id);
    if (!assignment) return '';
    return (
      this.technicians().find((technician) => technician.id === assignment.technicianId)?.fullName ??
      assignment.technicianId
    );
  }

  protected diagnosisFor(visit: Visit) {
    return this.visitsStore.diagnosisFor(visit.id);
  }

  protected ratingStars(score: number): string {
    return '★'.repeat(score) + '☆'.repeat(Math.max(0, 5 - score));
  }
}
