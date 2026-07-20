import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerraRidge } from './terra-ridge';

describe('TerraRidge', () => {
  let component: TerraRidge;
  let fixture: ComponentFixture<TerraRidge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerraRidge],
    }).compileComponents();

    fixture = TestBed.createComponent(TerraRidge);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
