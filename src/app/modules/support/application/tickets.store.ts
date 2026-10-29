import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthStore } from '../../iam/application/auth.store';
import { ServiceRating } from '../domain/model/service-rating.entity';
import { TicketPhoto } from '../domain/model/ticket-photo.entity';
import { TicketReply } from '../domain/model/ticket-reply.entity';
import { Ticket, TicketStatus } from '../domain/model/ticket.entity';
import { SupportApi } from '../infrastructure/support-api';

export type TicketFilter = TicketStatus | 'ALL';

export interface TicketDraft {
  meterId: string;
  subject: string;
  message: string;
}

interface StoreCallbacks<T> {
  onSuccess?: (value: T) => void;
  onError?: (message: string) => void;
}

/*
  TicketsStore owns the support queue plus the detail-side resources that the
  support-maintenance service keeps separate: replies, photos and rating.
*/
@Injectable({ providedIn: 'root' })
export class TicketsStore {
  private readonly api = inject(SupportApi);
  private readonly authStore = inject(AuthStore);

  private readonly itemsSignal = signal<Ticket[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  private readonly selectedSignal = signal<Ticket | null>(null);
  readonly selected = this.selectedSignal.asReadonly();

  private readonly repliesSignal = signal<TicketReply[]>([]);
  readonly replies = this.repliesSignal.asReadonly();

  private readonly photosSignal = signal<TicketPhoto[]>([]);
  readonly photos = this.photosSignal.asReadonly();

  private readonly ratingSignal = signal<ServiceRating | null>(null);
  readonly rating = this.ratingSignal.asReadonly();

  private readonly filterSignal = signal<TicketFilter>('ALL');
  readonly filter = this.filterSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly detailLoadingSignal = signal(false);
  readonly detailLoading = this.detailLoadingSignal.asReadonly();

  private readonly savingSignal = signal(false);
  readonly saving = this.savingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly visibleItems = computed(() => {
    const filter = this.filterSignal();
    return filter === 'ALL'
      ? this.itemsSignal()
      : this.itemsSignal().filter((ticket) => ticket.status === filter);
  });

  readonly openCount = computed(
    () => this.itemsSignal().filter((ticket) => ticket.isOpen).length,
  );
  readonly resolvedCount = computed(
    () => this.itemsSignal().filter((ticket) => ticket.status === 'RESOLVED').length,
  );

  readonly statuses: TicketFilter[] = [
    'ALL',
    'OPEN',
    'VISIT_REQUESTED',
    'RESOLVED',
    'CLOSED',
  ];

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getTickets().subscribe({
      next: (items) => {
        this.itemsSignal.set(items);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(this.messageFrom(err));
        this.loadingSignal.set(false);
      },
    });
  }

  loadTicket(id: string): void {
    this.detailLoadingSignal.set(true);
    this.errorSignal.set(null);
    this.selectedSignal.set(null);
    this.repliesSignal.set([]);
    this.photosSignal.set([]);
    this.ratingSignal.set(null);

    this.api.getTicket(id).subscribe({
      next: (ticket) => {
        this.selectedSignal.set(ticket);
        this.detailLoadingSignal.set(false);
        this.loadReplies(id);
        this.loadPhotos(id);
        this.loadRating(id);
      },
      error: (err) => {
        this.errorSignal.set(this.messageFrom(err));
        this.detailLoadingSignal.set(false);
      },
    });
  }

  setFilter(filter: TicketFilter): void {
    this.filterSignal.set(filter);
  }

  create(input: TicketDraft, callbacks?: StoreCallbacks<Ticket>): void {
    const accountId = this.authStore.currentUser()?.id;
    if (!accountId) {
      callbacks?.onError?.('Your session has expired. Sign in again.');
      return;
    }

    this.savingSignal.set(true);
    this.api
      .createTicket({
        principalAccountId: accountId,
        meterId: input.meterId,
        subject: input.subject,
        message: input.message,
      })
      .subscribe({
        next: (ticket) => {
          this.itemsSignal.update((items) => [ticket, ...items]);
          this.savingSignal.set(false);
          callbacks?.onSuccess?.(ticket);
        },
        error: (err) => {
          this.savingSignal.set(false);
          callbacks?.onError?.(this.messageFrom(err));
        },
      });
  }

  close(ticket: Ticket, callbacks?: StoreCallbacks<Ticket>): void {
    this.savingSignal.set(true);
    this.api.closeTicket(ticket.id).subscribe({
      next: (updated) => {
        this.replace(updated);
        this.savingSignal.set(false);
        callbacks?.onSuccess?.(updated);
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  sendReply(ticketId: string, body: string, callbacks?: StoreCallbacks<TicketReply>): void {
    const accountId = this.authStore.currentUser()?.id;
    if (!accountId) {
      callbacks?.onError?.('Your session has expired. Sign in again.');
      return;
    }

    this.savingSignal.set(true);
    this.api
      .addReply(ticketId, { authorAccountId: accountId, body })
      .subscribe({
        next: (reply) => {
          this.repliesSignal.update((items) => [...items, reply]);
          this.savingSignal.set(false);
          callbacks?.onSuccess?.(reply);
        },
        error: (err) => {
          this.savingSignal.set(false);
          callbacks?.onError?.(this.messageFrom(err));
        },
      });
  }

  addPhoto(
    ticketId: string,
    objectReference: string,
    callbacks?: StoreCallbacks<TicketPhoto>,
  ): void {
    const accountId = this.authStore.currentUser()?.id;
    if (!accountId) {
      callbacks?.onError?.('Your session has expired. Sign in again.');
      return;
    }

    this.savingSignal.set(true);
    this.api
      .addPhoto(ticketId, { objectReference, uploadedByAccountId: accountId })
      .subscribe({
        next: (photo) => {
          this.photosSignal.update((items) => [...items, photo]);
          this.savingSignal.set(false);
          callbacks?.onSuccess?.(photo);
        },
        error: (err) => {
          this.savingSignal.set(false);
          callbacks?.onError?.(this.messageFrom(err));
        },
      });
  }

  submitRating(
    ticketId: string,
    score: number,
    comment: string,
    callbacks?: StoreCallbacks<ServiceRating>,
  ): void {
    this.savingSignal.set(true);
    this.api.rateTicket(ticketId, { score, comment }).subscribe({
      next: (rating) => {
        this.ratingSignal.set(rating);
        this.savingSignal.set(false);
        this.refreshTicket(ticketId);
        callbacks?.onSuccess?.(rating);
      },
      error: (err) => {
        this.savingSignal.set(false);
        callbacks?.onError?.(this.messageFrom(err));
      },
    });
  }

  loadReplies(ticketId: string): void {
    this.api.getReplies(ticketId).subscribe({
      next: (replies) => this.repliesSignal.set(replies),
      error: (err) => this.errorSignal.set(this.messageFrom(err)),
    });
  }

  loadPhotos(ticketId: string): void {
    this.api.getPhotos(ticketId).subscribe({
      next: (photos) => this.photosSignal.set(photos),
      error: (err) => this.errorSignal.set(this.messageFrom(err)),
    });
  }

  loadRating(ticketId: string): void {
    this.api.getRating(ticketId).subscribe({
      next: (rating) => this.ratingSignal.set(rating),
      error: (err) => this.errorSignal.set(this.messageFrom(err)),
    });
  }

  private refreshTicket(ticketId: string): void {
    this.api.getTicket(ticketId).subscribe({
      next: (ticket) => this.replace(ticket),
      error: () => undefined,
    });
  }

  private replace(updated: Ticket): void {
    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === updated.id ? updated : item)),
    );
    if (this.selectedSignal()?.id === updated.id) {
      this.selectedSignal.set(updated);
    }
  }

  private messageFrom(err: unknown): string {
    return err instanceof Error && err.message
      ? err.message
      : 'Could not complete the operation.';
  }
}
