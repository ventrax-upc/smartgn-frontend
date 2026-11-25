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
      catchError((err) => throwError(() => this.toError(err, 'ui.couldNotLoadYourProfile'))),
    );
  }

  create(input: ProfileInputResource): Observable<Profile> {
    return this.http.post<ProfileResource>(this.url, this.normalize(input)).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'ui.couldNotCreateYourProfile'))),
    );
  }

  updateMine(input: ProfileInputResource): Observable<Profile> {
    return this.http.put<ProfileResource>(`${this.url}/me`, this.normalize(input)).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'ui.couldNotSaveYourProfile'))),
    );
  }

  private normalize(input: ProfileInputResource): ProfileInputResource {
    return {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone?.trim() || undefined,
      address: input.address?.trim() || undefined,
    };
  }

  private toError(err: unknown, fallback: string): Error {
    const httpErr = err as
      | { error?: { detail?: string; details?: string; message?: string }; message?: string; status?: number }
      | undefined;
    const message = httpErr?.error?.detail ?? httpErr?.error?.details ?? httpErr?.error?.message ?? fallback;
    const error = new Error(message) as Error & { status?: number };
    error.status = httpErr?.status;
    return error;
  }
}
