import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SupplyPoint } from '../domain/model/supply-point.entity';
import { SupplyPointAssembler } from './supply-point-assembler';
import {
  SupplyPointInputResource,
  SupplyPointResource,
  SupplyPointUpdateResource,
} from './supply-point-response';

@Injectable({ providedIn: 'root' })
export class SupplyPointsApi {
  private readonly http = inject(HttpClient);
  private readonly assembler = inject(SupplyPointAssembler);
  private readonly propertiesUrl = `${environment.apiUrl}/properties`;
  private readonly url = `${environment.apiUrl}/supply-points`;

  getAll(propertyId: string): Observable<SupplyPoint[]> {
    return this.http
      .get<SupplyPointResource[]>(`${this.propertiesUrl}/${propertyId}/supply-points`)
      .pipe(
        map((resources) => this.assembler.toEntitiesFromResponse(resources)),
        catchError((err) => throwError(() => this.toError(err, 'Could not load supply points.'))),
      );
  }

  create(propertyId: string, input: SupplyPointInputResource): Observable<SupplyPoint> {
    return this.http
      .post<SupplyPointResource>(`${this.propertiesUrl}/${propertyId}/supply-points`, input)
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError((err) => throwError(() => this.toError(err, 'Could not create the supply point.'))),
      );
  }

  update(id: string, input: SupplyPointUpdateResource): Observable<SupplyPoint> {
    return this.http.put<SupplyPointResource>(`${this.url}/${id}`, input).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not update the supply point.'))),
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
