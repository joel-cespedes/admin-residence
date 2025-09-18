import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResidenceFormModal } from './residence-form-modal';

describe('ResidenceFormModal', () => {
  let component: ResidenceFormModal;
  let fixture: ComponentFixture<ResidenceFormModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResidenceFormModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResidenceFormModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
