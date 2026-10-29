/*
  Imports tools to make testing Angular components easier.
*/
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

/*
  My confirm-dialog component, which is the one we want to test.
*/
import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

/*
  describe groups all tests related to the ConfirmDialog component.
*/
describe('ConfirmDialog', () => {
  let component: ConfirmDialog;
  let fixture: ComponentFixture<ConfirmDialog>;

  const dialogRefSpy = { close: () => undefined };
  const dialogData: ConfirmDialogData = {
    titleKey: 'demo.title',
    messageKey: 'demo.message',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
