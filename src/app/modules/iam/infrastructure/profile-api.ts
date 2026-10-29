import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Profile } from '../domain/model/profile.entity';
import { ProfileAssembler } from './profile-assembler';
import { ProfileInputResource, ProfileResource } from './profile-response';

@Injectable({ providedIn: 'root' })
export class ProfileApi {
  private readonly http = inject(HttpClient);
  private readonly assembler = inject(ProfileAssembler);
  private readonly url = `${environment.apiUrl}/profiles`;

  getMine(): Observable<Profile> {
    return this.http.get<ProfileResource>(`${this.url}/me`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not load your profile.'))),
    );
  }

  create(input: ProfileInputResource): Observable<Profile> {
    return this.http.post<ProfileResource>(this.url, input).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not create your profile.'))),
    );
  }

  updateMine(input: ProfileInputResource): Observable<Profile> {
    return this.http.put<ProfileResource>(`${this.url}/me`, input).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not save your profile.'))),
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
