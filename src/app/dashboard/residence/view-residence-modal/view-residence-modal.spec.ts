import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewResidenceModal } from './view-residence-modal';

describe('ViewResidenceModal', () => {
  let component: ViewResidenceModal;
  let fixture: ComponentFixture<ViewResidenceModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewResidenceModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewResidenceModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
