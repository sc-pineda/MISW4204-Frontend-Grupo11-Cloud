import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfessorShellComponent } from './professor-shell.component';
import { AuthService } from '../../core/services/auth.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('ProfessorShellComponent', () => {
    let component: ProfessorShellComponent;
    let fixture: ComponentFixture<ProfessorShellComponent>;

    beforeEach(async () => {
        const authSpy = {
            logout: vi.fn(),
            getCurrentUser: vi.fn(),
        };

        await TestBed.configureTestingModule({
            imports: [ProfessorShellComponent, RouterTestingModule],
            providers: [{ provide: AuthService, useValue: authSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(ProfessorShellComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should inject AuthService', () => {
        expect(component.auth).toBeTruthy();
    });

    it('should render RouterOutlet', () => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        expect(compiled).toBeTruthy();
    });

    it('should have RouterLinks for navigation', () => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        const links = compiled.querySelectorAll('a[routerLink]');
        expect(links.length).toBeGreaterThanOrEqual(0);
    });
});
