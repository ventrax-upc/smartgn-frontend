import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { KnowledgeArticle } from '../domain/model/knowledge-article.entity';
import { ServiceRating } from '../domain/model/service-rating.entity';
import { TechnicianAssignment } from '../domain/model/technician-assignment.entity';
import { Technician } from '../domain/model/technician.entity';
import { TicketPhoto } from '../domain/model/ticket-photo.entity';
import { TicketReply } from '../domain/model/ticket-reply.entity';
import { Ticket } from '../domain/model/ticket.entity';
import { VisitDiagnosis } from '../domain/model/visit-diagnosis.entity';
import { Visit } from '../domain/model/visit.entity';
import {
  ArticleAssembler,
  AssignmentAssembler,
  DiagnosisAssembler,
  PhotoAssembler,
  RatingAssembler,
  ReplyAssembler,
  TechnicianAssembler,
  TicketAssembler,
  VisitAssembler,
} from './support-assembler';
import {
  ArticleInputResource,
  ArticleResource,
  AssignmentInputResource,
  AssignmentResource,
  DiagnosisInputResource,
  DiagnosisResource,
  PhotoInputResource,
  PhotoResource,
  RatingInputResource,
  RatingResource,
  ReplyInputResource,
  ReplyResource,
  TechnicianInputResource,
  TechnicianResource,
  TicketInputResource,
  TicketResource,
  VisitInputResource,
  VisitResource,
} from './support-response';

/*
  SupportApi mirrors the support-maintenance service exactly:
    /api/v1/support/articles
    /api/v1/support/technicians
    /api/v1/support/tickets
    /api/v1/support/tickets/{ticketId}
    /api/v1/support/tickets/{ticketId}/close
    /api/v1/support/tickets/{ticketId}/replies
    /api/v1/support/tickets/{ticketId}/photos
    /api/v1/support/tickets/{ticketId}/rating
    /api/v1/support/tickets/{ticketId}/visits
    /api/v1/support/visits/{visitId}/assignments
    /api/v1/support/visits/{visitId}/diagnosis
*/
@Injectable({ providedIn: 'root' })
export class SupportApi {
  private readonly http = inject(HttpClient);
  private readonly articleAssembler = inject(ArticleAssembler);
  private readonly technicianAssembler = inject(TechnicianAssembler);
  private readonly ticketAssembler = inject(TicketAssembler);
  private readonly replyAssembler = inject(ReplyAssembler);
  private readonly photoAssembler = inject(PhotoAssembler);
  private readonly ratingAssembler = inject(RatingAssembler);
  private readonly visitAssembler = inject(VisitAssembler);
  private readonly assignmentAssembler = inject(AssignmentAssembler);
  private readonly diagnosisAssembler = inject(DiagnosisAssembler);
  private readonly url = `${environment.apiUrl}/support`;

  /* Articles ---------------------------------------------------------- */

  getArticles(): Observable<KnowledgeArticle[]> {
    return this.http.get<ArticleResource[]>(`${this.url}/articles`).pipe(
      map((resources) => this.articleAssembler.toEntitiesFromResponse(resources)),
      catchError((err) => throwError(() => this.toError(err, 'Could not load the help articles.'))),
    );
  }

  createArticle(input: ArticleInputResource): Observable<KnowledgeArticle> {
    return this.http.post<ArticleResource>(`${this.url}/articles`, input).pipe(
      map((resource) => this.articleAssembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not publish the article.'))),
    );
  }

  /* Technicians ------------------------------------------------------- */

  getTechnicians(): Observable<Technician[]> {
    return this.http.get<TechnicianResource[]>(`${this.url}/technicians`).pipe(
      map((resources) => this.technicianAssembler.toEntitiesFromResponse(resources)),
      catchError((err) => throwError(() => this.toError(err, 'Could not load technicians.'))),
    );
  }

  createTechnician(input: TechnicianInputResource): Observable<Technician> {
    return this.http.post<TechnicianResource>(`${this.url}/technicians`, input).pipe(
      map((resource) => this.technicianAssembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not create the technician.'))),
    );
  }

  /* Tickets ----------------------------------------------------------- */

  getTickets(): Observable<Ticket[]> {
    return this.http.get<TicketResource[]>(`${this.url}/tickets`).pipe(
      map((resources) => this.ticketAssembler.toEntitiesFromResponse(resources)),
      catchError((err) => throwError(() => this.toError(err, 'Could not load tickets.'))),
    );
  }

  getTicket(ticketId: string): Observable<Ticket> {
    return this.http.get<TicketResource>(`${this.url}/tickets/${ticketId}`).pipe(
      map((resource) => this.ticketAssembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not load the ticket.'))),
    );
  }

  createTicket(input: TicketInputResource): Observable<Ticket> {
    return this.http.post<TicketResource>(`${this.url}/tickets`, input).pipe(
      map((resource) => this.ticketAssembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not open the ticket.'))),
    );
  }

  closeTicket(ticketId: string): Observable<Ticket> {
    return this.http.put<TicketResource>(`${this.url}/tickets/${ticketId}/close`, {}).pipe(
      map((resource) => this.ticketAssembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not close the ticket.'))),
    );
  }

  /* Replies ----------------------------------------------------------- */

  getReplies(ticketId: string): Observable<TicketReply[]> {
    return this.http.get<ReplyResource[]>(`${this.url}/tickets/${ticketId}/replies`).pipe(
      map((resources) => this.replyAssembler.toEntitiesFromResponse(resources)),
      catchError((err) => throwError(() => this.toError(err, 'Could not load the conversation.'))),
    );
  }

  addReply(ticketId: string, input: ReplyInputResource): Observable<TicketReply> {
    return this.http.post<ReplyResource>(`${this.url}/tickets/${ticketId}/replies`, input).pipe(
      map((resource) => this.replyAssembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not send the reply.'))),
    );
  }

  /* Photos ------------------------------------------------------------ */

  getPhotos(ticketId: string): Observable<TicketPhoto[]> {
    return this.http.get<PhotoResource[]>(`${this.url}/tickets/${ticketId}/photos`).pipe(
      map((resources) => this.photoAssembler.toEntitiesFromResponse(resources)),
      catchError((err) => throwError(() => this.toError(err, 'Could not load the ticket photos.'))),
    );
  }

  addPhoto(ticketId: string, input: PhotoInputResource): Observable<TicketPhoto> {
    return this.http.post<PhotoResource>(`${this.url}/tickets/${ticketId}/photos`, input).pipe(
      map((resource) => this.photoAssembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not attach the photo.'))),
    );
  }

  /* Rating ------------------------------------------------------------ */

  getRating(ticketId: string): Observable<ServiceRating | null> {
    return this.http.get<RatingResource>(`${this.url}/tickets/${ticketId}/rating`).pipe(
      map((resource) => this.ratingAssembler.toEntityFromResource(resource)),
      catchError((err) => {
        if ((err as { status?: number })?.status === 404) return of(null);
        return throwError(() => this.toError(err, 'Could not load the service rating.'));
      }),
    );
  }

  rateTicket(ticketId: string, input: RatingInputResource): Observable<ServiceRating> {
    return this.http
      .post<RatingResource>(`${this.url}/tickets/${ticketId}/rating`, input)
      .pipe(
        map((resource) => this.ratingAssembler.toEntityFromResource(resource)),
        catchError((err) => throwError(() => this.toError(err, 'Could not submit the rating.'))),
      );
  }

  /* Visits ------------------------------------------------------------ */

  getVisits(ticketId: string): Observable<Visit[]> {
    return this.http.get<VisitResource[]>(`${this.url}/tickets/${ticketId}/visits`).pipe(
      map((resources) => this.visitAssembler.toEntitiesFromResponse(resources)),
      catchError((err) => throwError(() => this.toError(err, 'Could not load visits.'))),
    );
  }

  requestVisit(ticketId: string, input: VisitInputResource): Observable<Visit> {
    return this.http
      .post<VisitResource>(`${this.url}/tickets/${ticketId}/visits`, input)
      .pipe(
        map((resource) => this.visitAssembler.toEntityFromResource(resource)),
        catchError((err) => throwError(() => this.toError(err, 'Could not request the visit.'))),
      );
  }

  assignTechnician(
    visitId: string,
    input: AssignmentInputResource,
  ): Observable<TechnicianAssignment> {
    return this.http
      .post<AssignmentResource>(`${this.url}/visits/${visitId}/assignments`, input)
      .pipe(
        map((resource) => this.assignmentAssembler.toEntityFromResource(resource)),
        catchError((err) =>
          throwError(() => this.toError(err, 'Could not assign the technician.')),
        ),
      );
  }

  getDiagnosis(visitId: string): Observable<VisitDiagnosis | null> {
    return this.http.get<DiagnosisResource>(`${this.url}/visits/${visitId}/diagnosis`).pipe(
      map((resource) => this.diagnosisAssembler.toEntityFromResource(resource)),
      catchError((err) => {
        if ((err as { status?: number })?.status === 404) return of(null);
        return throwError(() => this.toError(err, 'Could not load the visit diagnosis.'));
      }),
    );
  }

  completeVisit(visitId: string, input: DiagnosisInputResource): Observable<VisitDiagnosis> {
    return this.http
      .post<DiagnosisResource>(`${this.url}/visits/${visitId}/diagnosis`, input)
      .pipe(
        map((resource) => this.diagnosisAssembler.toEntityFromResource(resource)),
        catchError((err) =>
          throwError(() => this.toError(err, 'Could not complete the visit.')),
        ),
      );
  }

  private toError(err: unknown, fallback: string): Error {
    const httpErr = err as
      | { error?: { details?: string; message?: string }; message?: string; status?: number }
      | undefined;
    const message = httpErr?.error?.details ?? httpErr?.error?.message ?? httpErr?.message ?? fallback;
    const error = new Error(message) as Error & { status?: number };
    error.status = httpErr?.status;
    return error;
  }
}
