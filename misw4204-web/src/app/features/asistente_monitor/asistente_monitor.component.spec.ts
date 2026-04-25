import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { AsistenteMonitorComponent } from './asistente_monitor.component';

describe('AsistenteMonitorComponent', () => {
  let component: AsistenteMonitorComponent;
  let fixture: ComponentFixture<AsistenteMonitorComponent>;
  let logoutCalls: number;

  beforeEach(async () => {
    logoutCalls = 0;

    TestBed.configureTestingModule({
      imports: [AsistenteMonitorComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            logout: () => {
              logoutCalls += 1;
            },
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AsistenteMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render assistant monitor navigation links', () => {
    const navLinks = Array.from(fixture.nativeElement.querySelectorAll('a.nav-link')) as HTMLAnchorElement[];
    const texts = navLinks.map((link) => link.textContent?.trim());

    expect(texts).toContain('Vinculaciones');
    expect(texts).toContain('Tareas');
    expect(texts).toContain('Nueva tarea');
  });

  it('should call auth.logout when clicking Salir button', () => {
    const logoutButton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    logoutButton.click();

    expect(logoutCalls).toBe(1);
  });
});
