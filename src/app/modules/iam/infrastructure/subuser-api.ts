import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MeterPermission, Subuser } from '../domain/model/subuser.entity';
import { SubuserAssembler } from './subuser-assembler';
import { SubuserResource } from './subuser-response';

export interface CreateSubuserPayload {
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable({ providedIn: 'root' })
export class SubuserApi {
  private readonly http = inject(HttpClient);
  private readonly assembler = inject(SubuserAssembler);
  private readonly url = `${environment.apiUrl}/subusers`;

  getAll(): Observable<Subuser[]> {
    return this.http.get<SubuserResource[]>(this.url).pipe(
      map((resources) => this.assembler.toEntitiesFromResponse(resources)),
      catchError((err) => throwError(() => this.toError(err, 'Could not load delegated accounts.'))),
    );
  }

  create(payload: CreateSubuserPayload): Observable<Subuser> {
    return this.http
      .post<SubuserResource>(this.url, {
        email: payload.email.trim().toLowerCase(),
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
      })
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError((err) => throwError(() => this.toError(err, 'Could not create the delegated account.'))),
      );
  }

  updateGrants(subuserId: string, meterId: string, permissions: MeterPermission[]): Observable<void> {
    return this.http
      .put<void>(`${this.url}/${subuserId}/grants`, { meterId, permissions })
      .pipe(catchError((err) => throwError(() => this.toError(err, 'Could not update permissions.'))));
  }

  getGrants(subuserId: string, meterId: string): Observable<MeterPermission[]> {
    return this.http
      .get<MeterPermission[]>(`${this.url}/${subuserId}/grants/${meterId}`)
      .pipe(catchError((err) => throwError(() => this.toError(err, 'Could not load permissions.'))));
  }

  revokeGrant(subuserId: string, meterId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.url}/${subuserId}/grants/${meterId}`)
      .pipe(catchError((err) => throwError(() => this.toError(err, 'Could not revoke permissions.'))));
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
