import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { PropertiesStore } from '../../../application/properties.store';
import { Property, PropertyType } from '../../../domain/model/property.entity';
import { ConfirmDialog } from '../../../../../shared/presentation/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-properties',
  imports: [ReactiveFormsModule, RouterLink, MatIcon],
  templateUrl: './properties.html',
  styleUrl: './properties.css',
})
export class PropertiesPage implements OnInit {
  private readonly store = inject(PropertiesStore);
  private readonly dialog = inject(MatDialog);

  protected readonly items = this.store.activeItems;
  protected readonly loading = this.store.loading;
  protected readonly saving = this.store.saving;
  protected readonly error = this.store.error;

  protected readonly editing = signal<Property | null>(null);
  protected readonly showForm = signal(false);
  protected readonly success = signal<string | null>(null);

  protected readonly formTitle = computed(() =>
    this.editing() ? 'Edit property' : 'Register a property',
  );

  protected readonly form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(150)]),
    address: new FormControl('', [Validators.required, Validators.maxLength(500)]),
    propertyType: new FormControl<PropertyType>('HOUSE', [Validators.required]),
  });

  ngOnInit(): void {
    this.store.load();
  }

  protected startCreate(): void {
    this.editing.set(null);
    this.form.reset({ name: '', address: '', propertyType: 'HOUSE' });
    this.showForm.set(true);
    this.success.set(null);
  }

  protected startEdit(property: Property): void {
    this.editing.set(property);
    this.form.reset({
      name: property.name,
      address: property.address,
      propertyType: property.propertyType,
    });
    this.showForm.set(true);
    this.success.set(null);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = {
      name: this.form.getRawValue().name ?? '',
      address: this.form.getRawValue().address ?? '',
      propertyType: this.form.getRawValue().propertyType ?? 'HOUSE',
    };
    const editing = this.editing();
    const callbacks = {
      onSuccess: () => {
        this.showForm.set(false);
        this.editing.set(null);
        this.success.set(editing ? 'Property updated.' : 'Property registered.');
      },
    };
    if (editing) this.store.update(editing, payload, callbacks);
    else this.store.create(payload, callbacks);
  }

  protected deactivate(property: Property): void {
    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        titleKey: 'Deactivate property',
        messageKey: `Deactivate "${property.name}"? Its history and supply points are preserved.`,
        confirmKey: 'Deactivate',
        iconName: 'domain_disabled',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.deactivate(property, {
          onSuccess: () => this.success.set('Property deactivated.'),
        });
      }
    });
  }
}
