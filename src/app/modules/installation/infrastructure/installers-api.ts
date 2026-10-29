import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Installer } from '../domain/model/installer.entity';
import { InstallerAssembler } from './installer-assembler';
import {
  InstallerInputResource,
  InstallerResource,
  InstallerUpdateResource,
} from './installer-response';

@Injectable({ providedIn: 'root' })
export class InstallersApi {
  private readonly http = inject(HttpClient);
  private readonly assembler = inject(InstallerAssembler);
  private readonly url = `${environment.apiUrl}/installers`;

  getAll(): Observable<Installer[]> {
    return this.http.get<InstallerResource[]>(this.url).pipe(
      map((resources) => this.assembler.toEntitiesFromResponse(resources)),
      catchError((err) => throwError(() => this.toError(err, 'Could not load installers.'))),
    );
  }

  create(input: InstallerInputResource): Observable<Installer> {
    return this.http.post<InstallerResource>(this.url, input).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not create the installer.'))),
    );
  }

  update(id: string, installer: InstallerInputResource, version: number): Observable<Installer> {
    const payload: InstallerUpdateResource = { installer, version };
    return this.http.put<InstallerResource>(`${this.url}/${id}`, payload).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not update the installer.'))),
    );
  }

  changeStatus(id: string, enabled: boolean, version: number): Observable<Installer> {
    return this.http
      .patch<InstallerResource>(`${this.url}/${id}/status`, { enabled, version })
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError((err) => throwError(() => this.toError(err, 'Could not change the installer status.'))),
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
