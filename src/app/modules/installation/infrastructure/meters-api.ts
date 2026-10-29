import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Meter } from '../domain/model/meter.entity';
import { MeterAssembler } from './meter-assembler';
import { MeterAccessResource } from './meter-response';

@Injectable({ providedIn: 'root' })
export class MetersApi {
  private readonly http = inject(HttpClient);
  private readonly assembler = inject(MeterAssembler);

  getAll(): Observable<Meter[]> {
    return this.http.get<MeterAccessResource[]>(`${environment.apiUrl}/meters`).pipe(
      map((resources) => this.assembler.toEntitiesFromResponse(resources)),
      catchError((err) => throwError(() => this.toError(err, 'Could not load supply points.'))),
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
