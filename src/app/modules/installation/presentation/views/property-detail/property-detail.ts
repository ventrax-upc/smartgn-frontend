import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { PropertiesApi } from '../../../infrastructure/properties-api';
import { SupplyPointsStore } from '../../../application/supply-points.store';
import { Property } from '../../../domain/model/property.entity';
import { SupplyPoint } from '../../../domain/model/supply-point.entity';

@Component({
  selector: 'app-property-detail',
  imports: [ReactiveFormsModule, RouterLink, MatIcon],
  templateUrl: './property-detail.html',
  styleUrl: './property-detail.css',
})
export class PropertyDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly propertiesApi = inject(PropertiesApi);
  private readonly pointsStore = inject(SupplyPointsStore);

  protected readonly property = signal<Property | null>(null);
  protected readonly propertyError = signal<string | null>(null);
  protected readonly points = this.pointsStore.items;
  protected readonly loading = this.pointsStore.loading;
  protected readonly saving = this.pointsStore.saving;
  protected readonly error = this.pointsStore.error;

  protected readonly editing = signal<SupplyPoint | null>(null);
  protected readonly success = signal<string | null>(null);

  protected readonly form = new FormGroup({
    serialNumber: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    locationName: new FormControl('', [Validators.required, Validators.maxLength(200)]),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.propertiesApi.getById(id).subscribe({
      next: (property) => this.property.set(property),
      error: (err) =>
        this.propertyError.set(
          err instanceof Error ? err.message : 'Could not load the property.',
        ),
    });
    this.pointsStore.load(id);
  }

  protected startCreate(): void {
    this.editing.set(null);
    this.form.reset({ serialNumber: '', locationName: '' });
    this.form.controls.serialNumber.enable();
  }

  protected startEdit(point: SupplyPoint): void {
    this.editing.set(point);
    this.form.reset({ serialNumber: point.serialNumber, locationName: point.locationName });
    this.form.controls.serialNumber.disable();
  }

  protected cancelEdit(): void {
    this.editing.set(null);
    this.form.reset({ serialNumber: '', locationName: '' });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const property = this.property();
    if (!property) return;
    const editing = this.editing();
    const value = this.form.getRawValue();
    if (editing) {
      this.pointsStore.update(editing, value.locationName ?? '', {
        onSuccess: () => {
          this.cancelEdit();
          this.success.set('Supply point updated.');
        },
      });
      return;
    }
    this.pointsStore.create(
      property.id,
      {
        serialNumber: value.serialNumber ?? '',
        locationName: value.locationName ?? '',
      },
      {
        onSuccess: () => {
          this.cancelEdit();
          this.success.set('Supply point registered.');
        },
      },
    );
  }
}
