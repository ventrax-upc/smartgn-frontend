# SmartGN Frontend

## Overview

SmartGN's web application for principal accounts, delegated users and SuperAdmins. It provides role-based dashboards, account and supply point management, installation and device operations, support, payments, consumption monitoring, Pro reports and alerts.

The SPA sends requests to the SmartGN API Gateway through `/api/v1`. English is the default interface language. Users can switch to Spanish before or after signing in, and the browser remembers the selection. Text supplied by backend services is displayed as received.

**Stack** Angular 21, TypeScript, RxJS, Angular Material, ngx-translate and Nginx.

## Run locally

Use Docker with Compose and PowerShell 7. These commands assume the `SmartGN` backend workspace and `smartgn-frontend` are siblings. Run them from the frontend repository:

```powershell
$gateway = '../SmartGN/smartgn-api-gateway'
pwsh -File "$gateway/scripts/start-integrated.ps1" -PrepareOnly
docker build -t smartgn-frontend:local .
docker compose --env-file "$gateway/.local/integrated.env" -f "$gateway/compose.integration.yml" -f compose.frontend.yml up -d --no-build --wait --wait-timeout 300
```

This reuses the existing backend images and volumes. If the backend images are missing, run `pwsh -File "$gateway/scripts/start-integrated.ps1"` first. Open [SmartGN](http://localhost:4200) or check [frontend health](http://localhost:4200/healthz).

For Angular development, use Node.js 22 and run `npm ci`, then `npm start` with the integrated Gateway available on port 8000. Stop the Docker frontend or pass `--port 4201` with `npm start -- --port 4201` if port 4200 is occupied. For offline UI development, `npm run dev` starts Angular and the Express mock API on port 3000. Stop the Angular dev server before switching modes. Use the integrated stack to validate backend behavior.

## Configuration

| Variable | Purpose | Local default |
| --- | --- | --- |
| `SMARTGN_FRONTEND_IMAGE` | Image selected by the local Compose overlay | `smartgn-frontend:local` |
| `SMARTGN_FRONTEND_BIND` | Host interface for Nginx | `127.0.0.1` |
| `SMARTGN_FRONTEND_PORT` | Published frontend port | `4200` |
| `SMARTGN_PUBLIC_ORIGIN` | Public origin for password reset links | `http://localhost:<frontend-port>` |
| `CORS_ORIGINS` | Origins allowed by the Gateway | Localhost and loopback on the frontend port |

Nginx serves the production Angular build, handles deep links and proxies API requests to `api-gateway:8000` on the Compose network.

## Verification

```bash
npm run lint
npm run build
npm test -- --watch=false
```

Use the integrated Gateway and a provisioned account to verify sign-in, consumption, Pro reports and alerts. Use the language selector to check both interface languages and reload the page to verify persistence.

## Deployment

Keep the verified images local until deployment is scheduled. For an EC2 integration deployment, publish all 12 application images to Docker Hub under the shared tag pattern `<namespace>/smartgn:<release>-<service>`. For example, the frontend image ends in `-frontend`. Build for the target host architecture and use a new release tag for each cut.

On EC2, install Docker with Compose and PowerShell 7. Keep the backend repositories in the same layout used locally so Compose can mount the initialization files. Sign in to Docker Hub if the registry repository is private. From the frontend repository, set the namespace and release tag and run:

```bash
export SMARTGN_DOCKERHUB_NAMESPACE=your-namespace
export SMARTGN_IMAGE_TAG=your-release
gateway=../SmartGN/smartgn-api-gateway
umask 077
pwsh -File "$gateway/scripts/start-integrated.ps1" -PrepareOnly
compose=(docker compose --env-file "$gateway/.local/integrated.env" -f "$gateway/compose.integration.yml" -f compose.frontend.yml -f compose.registry.yml)
"${compose[@]}" config --quiet
"${compose[@]}" pull
"${compose[@]}" up -d --no-build --wait --wait-timeout 300
curl --fail http://127.0.0.1:4200/healthz
```

For remote access, terminate TLS at the entry point and set `SMARTGN_PUBLIC_ORIGIN` and `CORS_ORIGINS` to the public HTTPS origin. If the load balancer runs outside the host, bind the frontend with `SMARTGN_FRONTEND_BIND=0.0.0.0` and restrict access to the load balancer. Preserve the Compose volumes and Gateway `.local` files across updates.

This Compose setup uses test delivery, simulated notifications and local billing. Production requires verified providers, production secrets and certificates, backups, and client IP handling for Gateway rate limiting behind Nginx.

## Repository layout

- `src/app/modules` contains the account, dashboard, installation, support, payment and analytics features.
- `src/app/shared` contains the app shell, language settings and shared HTTP handling.
- `public/i18n` contains the English and Spanish translation catalogs.
- `fake-api` contains the Express mock API and fixtures.
- `Dockerfile`, `nginx.conf` and `compose.*.yml` define the container build and runtime.

## License

Distributed under the [MIT License](LICENSE).
