import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Installation, InstallationStatus } from '../domain/model/installation.entity';
import { InstallationAssembler } from './installation-assembler';
import {
  CreateInstallationResource,
  InstallationResource,
} from './installation-response';

@Injectable({ providedIn: 'root' })
export class InstallationsApi {
  private readonly http = inject(HttpClient);
  private readonly assembler = inject(InstallationAssembler);
  private readonly url = `${environment.apiUrl}/installations`;

  getAll(status?: InstallationStatus): Observable<Installation[]> {
    const query = status ? `?status=${status}` : '';
    return this.http.get<InstallationResource[]>(`${this.url}${query}`).pipe(
      map((resources) => this.assembler.toEntitiesFromResponse(resources)),
      catchError((err) => throwError(() => this.toError(err, 'Could not load installations.'))),
    );
  }

  getById(id: string): Observable<Installation> {
    return this.http.get<InstallationResource>(`${this.url}/${id}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not load the installation.'))),
    );
  }

  create(input: CreateInstallationResource): Observable<Installation> {
    return this.http.post<InstallationResource>(this.url, input).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not create the installation.'))),
    );
  }

  assign(id: string, installerId: string): Observable<Installation> {
    return this.http
      .post<InstallationResource>(`${this.url}/${id}/assign`, { installerId })
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError((err) => throwError(() => this.toError(err, 'Could not assign the installer.'))),
      );
  }

  changeStatus(id: string, status: InstallationStatus): Observable<Installation> {
    return this.http
      .patch<InstallationResource>(`${this.url}/${id}/status`, { status })
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError((err) => throwError(() => this.toError(err, 'Could not update the installation.'))),
      );
  }

  cancel(id: string, version: number, reason: string): Observable<Installation> {
    return this.http
      .post<InstallationResource>(`${this.url}/${id}/cancel`, { version, reason })
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError((err) => throwError(() => this.toError(err, 'Could not cancel the installation.'))),
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
