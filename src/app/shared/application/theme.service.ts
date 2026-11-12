import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'smartgn-theme';
const THEME_COLORS: Record<ThemeMode, string> = {
  dark: '#080d0a',
  light: '#e2dfdd',
};

/*
  Owns the light/dark mode of the whole app.

  The mode is stored on <html data-theme="..."> so material-theme.scss can swap
  every --smartgn-* token and the Material system tokens at once. The choice is
  persisted in localStorage; dark stays the default product theme.
*/
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly modeSignal = signal<ThemeMode>(this.readStored());
  readonly mode = this.modeSignal.asReadonly();

  constructor() {
    this.apply(this.modeSignal());
  }

  toggle(): void {
    this.set(this.modeSignal() === 'dark' ? 'light' : 'dark');
  }

  set(mode: ThemeMode): void {
    this.modeSignal.set(mode);
    this.apply(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Storage can be blocked (private mode); the theme still applies for this session.
    }
  }

  private readStored(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // ignore and fall back to the default
    }
    return 'dark';
  }

  private apply(mode: ThemeMode): void {
    const root = this.document.documentElement;
    root.setAttribute('data-theme', mode);
    this.document
      .querySelector('meta[name="color-scheme"]')
      ?.setAttribute('content', mode);
    this.document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLORS[mode]);
  }
}
