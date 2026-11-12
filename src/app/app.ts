import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from './shared/application/language.service';
import { ThemeService } from './shared/application/theme.service';

/*
  App used to always render <app-layout/> directly, which meant every page
  (including login/register) got the toolbar + sidebar wrapped around it.

  Now Layout is rendered by the router itself (see app.routes.ts): it only
  wraps protected routes, while /sign-in and /sign-up render full-screen
  through this same <router-outlet/>.
*/
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Injecting the services is what applies the saved theme and language at startup.
  private readonly theme = inject(ThemeService);
  private readonly language = inject(LanguageService);
}
