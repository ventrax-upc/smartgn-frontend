import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Property } from '../domain/model/property.entity';
import { PropertyAssembler } from './property-assembler';
import {
  PropertyInputResource,
  PropertyResource,
  PropertyUpdateResource,
} from './property-response';

/*
  Mirrors the installation service PropertyController. Property updates use
  optimistic concurrency, so every PUT must send the current version.
*/
@Injectable({ providedIn: 'root' })
export class PropertiesApi {
  private readonly http = inject(HttpClient);
  private readonly assembler = inject(PropertyAssembler);
  private readonly url = `${environment.apiUrl}/properties`;

  getAll(): Observable<Property[]> {
    return this.http.get<PropertyResource[]>(this.url).pipe(
      map((resources) => this.assembler.toEntitiesFromResponse(resources)),
      catchError((err) => throwError(() => this.toError(err, 'Could not load properties.'))),
    );
  }

  getById(id: string): Observable<Property> {
    return this.http.get<PropertyResource>(`${this.url}/${id}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not load the property.'))),
    );
  }

  create(input: PropertyInputResource): Observable<Property> {
    return this.http.post<PropertyResource>(this.url, input).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not create the property.'))),
    );
  }

  update(id: string, input: PropertyUpdateResource): Observable<Property> {
    return this.http.put<PropertyResource>(`${this.url}/${id}`, input).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not update the property.'))),
    );
  }

  deactivate(id: string, version: number): Observable<Property> {
    return this.http.delete<PropertyResource>(`${this.url}/${id}?version=${version}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not deactivate the property.'))),
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
