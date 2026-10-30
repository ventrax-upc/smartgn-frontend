# SmartGN Frontend

Frontend de SmartGN en Angular 21 para Ventrax / UPC AV3. Cubre Sprint 1 y Sprint 2: identidad y acceso, propiedades y suministros, subusuarios, soporte, pagos y dashboard.

Consume una API local que replica los contratos de IAM, instalación, pagos y `smartgn-support-maintenance`, por lo que puede apuntarse al backend real cambiando únicamente la URL de entorno.

## Stack

- Angular 21 (standalone components, signals, `@if` / `@for`)
- TypeScript, RxJS y Angular Material
- `HttpClient` con interceptor JWT
- `ngx-translate` (solo inglés)
- Vitest + Angular TestBed
- API fake en Express persistida en `fake-api/db.json`

## Estructura

```
src/app/
  modules/
    iam/            autenticación, perfil, subusuarios, guards
    installation/   propiedades, suministros, medidores, instalaciones, devices, instaladores
    support/        artículos, tickets, respuestas, fotos, ratings, visitas y técnicos
    payment/        suscripción, métodos de pago e historial
    home/           dashboard según el rol
  shared/
    domain/         modelos y assemblers compartidos
    infrastructure/ interceptor y plumbing HTTP
    presentation/   layout, sidebar, toolbar, diálogos y estilos de página
    utils/          formato y manejo de errores
```

Cada módulo se carga con lazy loading y se divide en `domain/model`, `infrastructure`, `application` y `presentation`. Las vistas no llaman a `HttpClient` directamente: usan stores, y los stores usan los clientes de infraestructura.

## Auth Y API

- El login usa `email + password`.
- El token JWT se guarda en `sessionStorage` como `smartgn:accessToken`.
- El usuario de sesión se guarda como `smartgn:authUser`.
- El interceptor agrega `Authorization: Bearer <token>` a las requests.
- Solo existen dos roles: `USER` y `SUPERADMIN`.
- Los usuarios delegados son `USER` con `accountKind: DELEGATED`.
- No hay registro público: las cuentas se activan con un token de un solo uso.
- El principal gestiona propiedades, subusuarios, suscripción, pagos y tickets.
- El delegado solo ve los medidores y tickets que le fueron asignados.
- El SuperAdmin gestiona instalaciones, devices, instaladores, técnicos, artículos, tickets, asignaciones y diagnósticos; no accede a la facturación del cliente.

## Rutas Principales

Auth público:

- `/sign-in`
- `/forgot-password`
- `/reset-password`
- `/activate-password`

Usuario principal:

- `/home`
- `/installation/properties`, `/installation/properties/:id`
- `/installation/meters`
- `/installation/devices`
- `/account/subusers`
- `/account/profile`
- `/payments/subscription`, `/payments/methods`, `/payments/history`
- `/support/tickets`, `/support/tickets/:id`
- `/support/visits`
- `/support/guides`

Usuario delegado:

- `/home`
- `/installation/meters`
- `/installation/devices`
- `/account/profile`
- `/support/tickets`, `/support/tickets/:id`
- `/support/visits`
- `/support/guides`

SuperAdmin:

- `/home`
- `/installation/installations`
- `/installation/devices`
- `/installation/installers`
- `/support/tickets`, `/support/tickets/:id`
- `/support/visits`
- `/support/technicians`
- `/support/guides` (puede publicar artículos)
- `/account/profile`

## Cuentas demo

Todas las cuentas usan la contraseña `SmartGN123`.

| Rol | Email | Account kind | Acceso |
| --- | --- | --- | --- |
| SuperAdmin | `admin@smartgn.pe` | PRINCIPAL | Operaciones, instalaciones, devices, instaladores, técnicos, artículos y todo soporte |
| Principal | `user@smartgn.pe` | PRINCIPAL | Propiedades, suministros, medidores, subusuarios, pagos y soporte |
| Delegado | `delegated@smartgn.pe` | DELEGATED | Medidores asignados, devices de solo lectura, tickets y soporte |
| Pendiente | `pending@smartgn.pe` | DELEGATED | Activación con el token `act-demo-400` |

La recuperación de contraseña devuelve un `demoResetToken` en la respuesta de la API fake para poder completar el flujo localmente.

Para probar otra cuenta, agrégala en `fake-api/db.json` (en `users` y `profiles`, y en `subusers` si es delegada), reinicia `npm run start:api` y usa la contraseña definida en el registro.

## Correr el proyecto

```bash
npm install
npm run dev
```

`npm run dev` levanta ambos procesos:

- API fake: `http://localhost:3000/api/v1`
- SPA: `http://localhost:4200`

También se pueden ejecutar por separado:

```bash
npm run start:api
npm start
```

Para compilar:

```bash
npm run build
```

En desarrollo, `src/environments/environment.development.ts` apunta a `http://localhost:3000/api/v1`.

En producción, `src/environments/environment.ts` apunta a `/api/v1`.

> **Importante:** el puerto `3000` debe quedar para `npm run start:api`. No ejecutes `json-server` sobre ese puerto: no implementa `/api/v1/auth/sign-in` y el login devolverá `404 Not Found`.

Los datos de demo viven en `fake-api/db.json`. Para reiniciar la demo, reemplaza ese archivo por una copia limpia y vuelve a iniciar la API.

## API local y contratos de Support

`fake-api/server.mjs` implementa los contratos usados por la SPA:

- IAM: login, recuperación y cambio de contraseña, activación, perfil, subusuarios y permisos.
- Instalación: propiedades, suministros, medidores, instalaciones, instaladores y devices.
- Pagos: suscripción, renovación, métodos de pago, órdenes, historial y documentos (`pdf`, `xml`, `cdr`).
- Soporte: artículos, técnicos disponibles, tickets, respuestas, fotos, ratings, visitas, asignaciones y diagnósticos.

El bloque de soporte replica `smartgn-support-maintenance` y devuelve los agregados directamente con `ticketId`, `visitId`, `technicianId`, `articleId`, `replyId`, `photoId`, `ratingId`, `assignmentId` y `diagnosisId`.

### Endpoints de Support

| Método | Endpoint |
| --- | --- |
| `GET` / `POST` | `/support/articles` |
| `GET` / `POST` | `/support/technicians` |
| `GET` / `POST` | `/support/tickets` |
| `GET` | `/support/tickets/:ticketId` |
| `GET` / `POST` | `/support/tickets/:ticketId/replies` |
| `PUT` | `/support/tickets/:ticketId/close` |
| `GET` / `POST` | `/support/tickets/:ticketId/photos` |
| `GET` / `POST` | `/support/tickets/:ticketId/rating` |
| `GET` / `POST` | `/support/tickets/:ticketId/visits` |
| `POST` | `/support/visits/:visitId/assignments` |
| `GET` / `POST` | `/support/visits/:visitId/diagnosis` |

Los estados de ticket son `OPEN`, `VISIT_REQUESTED`, `RESOLVED` y `CLOSED`. Los estados de visita son `REQUESTED`, `ASSIGNED`, `COMPLETED` y `CANCELLED`.

Registrar un diagnóstico completa la visita y resuelve el ticket. Calificar un ticket lo cierra y solo puede hacerse una vez. Las fotos guardan una referencia de objeto, no el archivo binario; los artículos guardan una referencia de contenido y una categoría libre.

No existe una colección global de visitas: `VisitsStore` carga los tickets y solicita `/support/tickets/:ticketId/visits` por cada uno. Tampoco existe un `GET` de asignaciones, por lo que después de recargar solo se conserva el `technicianId` de la asignación.

La API fake mantiene las reglas de autorización de la demo: el SuperAdmin ve todos los tickets, el principal ve los de su cuenta, el delegado ve los de sus suministros asignados, solo el SuperAdmin gestiona técnicos/artículos/asignaciones/diagnósticos, y los clientes crean tickets, respuestas, fotos, solicitudes de visita y ratings.

## Calidad

```bash
npm run lint
npm run build
npm test -- --watch=false
```

Los tests usan un provider compartido (`src/test-providers.ts`) que configura el router, un backend HTTP de pruebas, traducción sin requests y animaciones deshabilitadas.

## Deploy

El proyecto incluye `vercel.json` y se despliega como sitio estático. En producción el frontend depende de que el backend exponga `/api/v1` con los contratos descritos arriba.
