import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyChatbotComponent } from './my-chatbot.component';

describe('MyChatbotComponent', () => {
  let component: MyChatbotComponent;
  let fixture: ComponentFixture<MyChatbotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MyChatbotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyChatbotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
