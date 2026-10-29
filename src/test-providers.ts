import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

/*
  Global providers for the Angular unit-test environment.

  - provideRouter([]) satisfies RouterOutlet/RouterLink dependencies in the
    layout shell without bootstrapping the real application routes.
  - provideHttpClient + testing backend keep API-dependent stores from
    reaching the network.
  - provideTranslateService defaults to TranslateNoOpLoader, so templates
    render translation keys instead of requesting i18n/en.json.
  - provideNoopAnimations keeps Angular Material overlays synchronous.
*/
export default [
  provideRouter([]),
  provideHttpClient(),
  provideHttpClientTesting(),
  provideNoopAnimations(),
  provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
];
