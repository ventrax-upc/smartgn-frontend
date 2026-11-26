# SmartGN Frontend

## Overview

SmartGN's web application for principal accounts, delegated users and SuperAdmins. It provides role-based dashboards, account and supply point management, installation and device operations, support, payments, consumption monitoring, Pro reports and alerts.

The SPA sends requests to the SmartGN API Gateway through `/api/v1`. English is the default interface language. Users can switch to Spanish before or after signing in, and the browser remembers the selection. Text supplied by backend services is displayed as received.

**Stack** Angular 21, TypeScript, RxJS, Angular Material, ngx-translate and Nginx.

## Run locally

The [integrated startup guide](https://github.com/ventrax-upc/smartgn-api-gateway/blob/develop/README.md#start-all-13-repositories-locally) covers all 13 repositories. The commands below describe this component.

Use Docker with Compose and PowerShell 7. These commands assume the `SmartGN` backend workspace and `smartgn-frontend` are siblings. Run them from the frontend repository:

```powershell
$gateway = '../SmartGN/smartgn-api-gateway'
pwsh -File "$gateway/scripts/start-integrated.ps1" -PrepareOnly
docker build -t smartgn-frontend:local .
docker compose --env-file "$gateway/.local/integrated.env" -f "$gateway/compose.integration.yml" -f compose.frontend.yml up -d --no-build --wait --wait-timeout 300
```

This reuses the existing backend images and volumes. If the backend images are missing, run `pwsh -File "$gateway/scripts/start-integrated.ps1"` first. Open [SmartGN](http://localhost:4200) or check [frontend health](http://localhost:4200/healthz).

For Angular development, use Node.js 22 and run `npm ci`, then `npm start` with the integrated Gateway available on port 8000. Stop the Docker frontend or pass `--port 4201` with `npm start -- --port 4201` if port 4200 is occupied. For offline UI development, `npm run dev` starts Angular and the Express mock API on port 3000. Stop the Angular dev server before switching modes. Use the integrated stack to validate backend behavior.

### Password recovery

Open **Forgot password?** on the sign-in page. Request a code for a
registered active account, verify it, and enter the new password twice.
After saving, the SPA signs in with the new password.

Integrated Compose sends the code to the local delivery fixture. Use the
same email address when the command prompts you. The offline mock API
prints its own test code in the mock server terminal.

```powershell
$email = Read-Host 'Email entered in SmartGN'
@'
import json
import os
import sys
from urllib.parse import urlencode
from urllib.request import Request, urlopen

url = "http://localhost:8091/fixtures/messages?" + urlencode({"email": sys.argv[1].strip().lower()})
request = Request(url, headers={"Authorization": "Bearer " + os.environ["FIXTURE_ADMIN_TOKEN"]})
with urlopen(request) as response:
    messages = json.load(response)
print(next((message["code"] for message in reversed(messages)
            if message["purpose"] == "RECOVERY_CODE"), "No recovery code found."))
'@ | docker exec -i smartgn-dev-delivery-1 python - $email
```

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

## Deploy the SPA with the backend on AWS

Use the [Gateway AWS guide](https://github.com/ventrax-upc/smartgn-api-gateway/blob/develop/README.md#deploy-the-backend-and-spa-on-aws)
to publish the 12 images and start the shared stack on EC2. The image for
this repository is `<namespace>/smartgn:<release>-frontend`. The registry
overlay uses it with `compose.frontend.yml` and the Gateway's base Compose.

Set the following in the Gateway deployment environment file before running
Compose. The browser uses relative `/api/v1` URLs, so the image can be reused
between environments.

| Variable | Deployment value |
| --- | --- |
| `SMARTGN_DOCKERHUB_NAMESPACE`, `SMARTGN_IMAGE_TAG` | Namespace and release shared by the 12 images. |
| `SMARTGN_PUBLIC_ORIGIN` | Public SPA HTTPS origin, e.g. `https://app.smartgn.example`. Compose appends the activation and reset paths for IAM. |
| `SMARTGN_GATEWAY_UPSTREAM` | Private Gateway `host:port`, normally `api-gateway:8000` on Compose. |
| `SMARTGN_DNS_RESOLVER` | Container DNS resolver, normally `127.0.0.11` on Compose. |
| `SMARTGN_FRONTEND_BIND`, `SMARTGN_FRONTEND_PORT` | EC2 private IPv4 and host port, normally `4200`. The ALB target group uses this port and `/healthz`. |
| `ACTIVATION_LINK_BASE_URL`, `PASSWORD_RESET_LINK_BASE_URL` | Optional IAM overrides. Use complete HTTPS URLs ending in `/activate-password` and `/reset-password`. |
| `CORS_ORIGINS` | Gateway allowlist containing the deployed SPA and Landing origins. |

Verify `https://<spa-host>/healthz`, a direct navigation to `/activate-password`
and authenticated requests under `/api/v1`. Then use a test account to verify
the activation and recovery emails point to the deployed SPA.

Frontend CI runs lint, tests and the production build, then checks the
container for health, Angular deep-link routing and API proxying. Releases
are published through the Gateway deployment procedure.

## Repository layout

- `src/app/modules` contains the account, dashboard, installation, support, payment and analytics features.
- `src/app/shared` contains the app shell, language settings and shared HTTP handling.
- `public/i18n` contains the English and Spanish translation catalogs.
- `fake-api` contains the Express mock API and fixtures.
- `Dockerfile`, `nginx.conf` and `compose.*.yml` define the container build and runtime.

## Acceptance scenarios

See the [Gherkin acceptance scenarios](docs/acceptance/scenarios.gherkin). These are acceptance specifications. Use the verification commands above to run the automated checks.

## License

Distributed under the [MIT License](LICENSE).
