import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Device, DeviceStatus, ProvisioningReceipt } from '../domain/model/device.entity';
import { DeviceAssembler } from './device-assembler';
import {
  DeviceResource,
  ProvisioningReceiptResource,
  RegisterDeviceResource,
} from './device-response';

@Injectable({ providedIn: 'root' })
export class DevicesApi {
  private readonly http = inject(HttpClient);
  private readonly assembler = inject(DeviceAssembler);
  private readonly url = `${environment.apiUrl}/devices`;

  getAll(filters?: { pointId?: string; status?: DeviceStatus }): Observable<Device[]> {
    const params = new URLSearchParams();
    if (filters?.pointId) params.set('pointId', filters.pointId);
    if (filters?.status) params.set('status', filters.status);
    const query = params.toString();
    return this.http.get<DeviceResource[]>(`${this.url}${query ? `?${query}` : ''}`).pipe(
      map((resources) => this.assembler.toEntitiesFromResponse(resources)),
      catchError((err) => throwError(() => this.toError(err, 'Could not load devices.'))),
    );
  }

  getById(id: string): Observable<Device> {
    return this.http.get<DeviceResource>(`${this.url}/${id}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not load the device.'))),
    );
  }

  register(input: RegisterDeviceResource): Observable<ProvisioningReceipt> {
    return this.http.post<ProvisioningReceiptResource>(this.url, input).pipe(
      map((resource) => this.assembler.toReceipt(resource)),
      catchError((err) => throwError(() => this.toError(err, 'Could not register the device.'))),
    );
  }

  rotateCredentials(id: string): Observable<ProvisioningReceipt> {
    return this.http
      .post<ProvisioningReceiptResource>(`${this.url}/${id}/credentials/rotate`, {})
      .pipe(
        map((resource) => this.assembler.toReceipt(resource)),
        catchError((err) => throwError(() => this.toError(err, 'Could not rotate the credential.'))),
      );
  }

  revoke(id: string): Observable<Device> {
    return this.http
      .post<DeviceResource>(`${this.url}/${id}/credentials/revoke`, {})
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError((err) => throwError(() => this.toError(err, 'Could not revoke the device.'))),
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
