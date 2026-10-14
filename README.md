# ncentral-mcp

MCP (Model Context Protocol) server for [N-able N-central](https://www.n-able.com/products/n-central-rmm).
It exposes the N-central REST API (`/api`) to Claude and other MCP clients: org units,
device inventory, monitoring, scheduled tasks, custom properties, maintenance windows,
and access groups.

Built on [`@wyre-technology/node-ncentral`](https://github.com/WYRE-AI/node-ncentral).

## Tool exposure

All tools are exposed flat: `tools/list` always returns the full set (the two helpers
below plus every domain tool), and `tools/call` routes by tool name — you can call any
tool directly without a prior navigation step. This matches the deployed WYRE fleet and
lets one-shot `tools/list` aggregation (e.g. the Conduit gateway) see the complete tool
surface.

| Tool | Description |
|------|-------------|
| `ncentral_navigate` | Optional informational helper that lists the tool domains (`system`, `orgs`, `devices`, `monitoring`, `tasks`, `custom-properties`, `maintenance`, `access-groups`) |
| `ncentral_status` | Connectivity check — calls the health + server-info endpoints |

## Tool catalog

### system

| Tool | Description |
|------|-------------|
| `ncentral_health` | API health (server start/current time) |
| `ncentral_server_info` | N-central server + API-Service version info |
| `ncentral_validate_token` | Validate the configured API token |

### orgs

| Tool | Description |
|------|-------------|
| `ncentral_list_service_orgs` | List service organizations |
| `ncentral_list_customers` | List customers (optionally scoped to a service org via `soId`) |
| `ncentral_get_customer` | Get a customer by id |
| `ncentral_list_sites` | List sites (optionally scoped to a customer via `customerId`) |
| `ncentral_get_site` | Get a site by id |
| `ncentral_list_org_units` | List all org units |
| `ncentral_get_org_unit` | Get an org unit by id |
| `ncentral_list_org_unit_children` | List an org unit's children |
| `ncentral_get_registration_token` | Get the agent/probe registration token for a customer, site, or org unit (**sensitive — treat as a secret**) |

### devices

| Tool | Description |
|------|-------------|
| `ncentral_list_devices` | List devices (supports saved `filterId`; offers to narrow scope when unfiltered) |
| `ncentral_get_device` | Get a device by id |
| `ncentral_get_device_assets` | Device asset/inventory info |
| `ncentral_get_device_lifecycle` | Asset lifecycle info (warranty, purchase, replacement) |
| `ncentral_update_device_lifecycle` | ⚠ HIGH-IMPACT — update lifecycle info |
| `ncentral_get_device_service_status` | Service monitor status |
| `ncentral_list_devices_by_org_unit` | List devices under an org unit |
| `ncentral_list_device_filters` | List saved device filters |

### monitoring

| Tool | Description |
|------|-------------|
| `ncentral_list_active_issues` | Active issues for an org unit (customers/sites only) |
| `ncentral_list_job_statuses` | Job statuses for an org unit |

### tasks

| Tool | Description |
|------|-------------|
| `ncentral_list_device_tasks` | Scheduled tasks for a device |
| `ncentral_get_task` | Get a scheduled task |
| `ncentral_get_task_status` | Aggregated task status |
| `ncentral_get_task_status_details` | Per-device task status details |
| `ncentral_create_direct_task` | ⚠ HIGH-IMPACT — creates a direct task that executes **immediately** on a live endpoint |

### custom-properties

| Tool | Description |
|------|-------------|
| `ncentral_list_org_custom_properties` | List an org unit's custom properties |
| `ncentral_get_org_custom_property` | Get one org unit custom property |
| `ncentral_update_org_custom_property` | ⚠ HIGH-IMPACT — overwrite an org unit custom property value |
| `ncentral_list_device_custom_properties` | List a device's custom properties |
| `ncentral_get_device_custom_property` | Get one device custom property |
| `ncentral_update_device_custom_property` | ⚠ HIGH-IMPACT — overwrite a device custom property value |

### maintenance

| Tool | Description |
|------|-------------|
| `ncentral_list_maintenance_windows` | List a device's maintenance windows |
| `ncentral_add_maintenance_windows` | ⚠ HIGH-IMPACT — add maintenance windows to devices |
| `ncentral_delete_maintenance_windows` | ⚠ DESTRUCTIVE — IRREVERSIBLE — delete maintenance window schedules |

### access-groups

| Tool | Description |
|------|-------------|
| `ncentral_list_access_groups` | List access groups for an org unit |
| `ncentral_get_access_group` | Get an access group by id |
| `ncentral_create_device_access_group` | ⚠ HIGH-IMPACT — create a device access group |
| `ncentral_create_org_unit_access_group` | ⚠ HIGH-IMPACT — create an org unit access group |

All list tools accept the standard N-central pagination parameters (`pageNumber`,
`pageSize`, `sortBy`, `sortOrder`) and include pagination metadata in the response so
clients can page through large result sets. Empty results return an explicit
"No X found" error rather than an empty array.

## Generating an N-central User-API Token

The server authenticates with a permanent **User-API Token (JWT)** generated in the
N-central UI:

1. Log into N-central as (or as an admin of) the API user. A dedicated least-privilege
   API service account is strongly recommended.
2. Go to **Administration → User Management → Users** and open the user.
3. Open the **API Access** tab.
4. Click **Generate JSON Web Token** and copy the token.

The token inherits the user's role and org unit access. The server exchanges it for
short-lived access/refresh tokens automatically — you only ever configure the User-API
Token.

## Standalone usage

### Environment variables

Copy [`.env.example`](.env.example) and set the variables below.

| Variable | Required | Description |
|----------|----------|-------------|
| `NCENTRAL_SERVER_URL` | For stdio and `AUTH_MODE=env` | Base URL of your N-central server, e.g. `https://ncentral.example.com`. The Compose gateway service does not load this variable. |
| `NCENTRAL_JWT` | For stdio and `AUTH_MODE=env` | User-API Token (JWT) generated in the N-central UI. The Compose gateway service does not load this variable. |
| `MCP_TRANSPORT` | No | `stdio` (default) or `http` |
| `AUTH_MODE` | No | `gateway` (Docker image and Compose default) or `env`. Gateway mode requires `x-ncentral-server-url` and `x-ncentral-jwt` on each `/mcp` request and never falls back to `NCENTRAL_*`. `env` uses those variables only after S2S auth succeeds. |
| `CONDUIT_S2S_SECRET` | Yes for HTTP | Service-to-service secret. Generate with `openssl rand -hex 32`. The HTTP server logs an error and exits non-zero when this is empty or a known placeholder (`changeme`, `your-s2s-secret`, `secret`, `placeholder`, and similar public examples). Compose will not start without it. Never commit a real value. The value is never logged. |
| `MCP_ALLOW_INSECURE_DEV` | No | Set to exactly `1` only for local development to start HTTP without `CONDUIT_S2S_SECRET`. The process logs a warning, does not enforce `X-Gateway-S2S`, and forces the listener onto `127.0.0.1` even if `MCP_HTTP_HOST` is a wider address. A known placeholder secret is still refused. |
| `MCP_HTTP_HOST` | No | Bind address when `MCP_TRANSPORT=http`. Defaults to `127.0.0.1` when unset. A configured `CONDUIT_S2S_SECRET` honors this value. The container image sets `0.0.0.0`. Without a secret, `MCP_ALLOW_INSECURE_DEV=1` binds `127.0.0.1` only. |
| `MCP_HTTP_PORT` | No | HTTP port. Defaults to `8080`. |
| `LOG_LEVEL` | No | `debug`, `info` (default), `warn`, `error` — all logs go to stderr |

`/health` stays unauthenticated and does not read credentials. The stdio transport does not use `CONDUIT_S2S_SECRET`.

### HTTP authentication

With `MCP_TRANSPORT=http` and `CONDUIT_S2S_SECRET` set, every `/mcp` request must include `X-Gateway-S2S`. The check is `verifyS2sHeader` in [`src/s2s-verify.ts`](src/s2s-verify.ts): the header value is `t=<unix seconds>,v1=<hex>`, where the hex is HMAC-SHA256 of the literal string `t=<unix seconds>` keyed with `CONDUIT_S2S_SECRET` (64 lowercase hex characters). The timestamp must be within 300 seconds of the server clock. A missing or invalid header returns HTTP 401 before vendor credentials are read.

In `AUTH_MODE=gateway`, `/mcp` also requires `x-ncentral-server-url` and `x-ncentral-jwt`. Those headers are the only credential source for that request. A request missing either header returns HTTP 401 and does not fall back to `NCENTRAL_SERVER_URL` / `NCENTRAL_JWT`.

### stdio (Claude Desktop / local MCP client)

```bash
npm install && npm run build

NCENTRAL_SERVER_URL=https://ncentral.example.com \
NCENTRAL_JWT=eyJ... \
node dist/index.js
```

Claude Desktop config:

```json
{
  "mcpServers": {
    "ncentral": {
      "command": "node",
      "args": ["/path/to/ncentral-mcp/dist/index.js"],
      "env": {
        "NCENTRAL_SERVER_URL": "https://ncentral.example.com",
        "NCENTRAL_JWT": "eyJ..."
      }
    }
  }
}
```

### HTTP (Streamable HTTP)

```bash
CONDUIT_S2S_SECRET="$CONDUIT_S2S_SECRET" \
MCP_TRANSPORT=http \
AUTH_MODE=env \
NCENTRAL_SERVER_URL=https://ncentral.example.com \
NCENTRAL_JWT=eyJ... \
node dist/http.js
```

Endpoints: `POST /mcp` (MCP protocol, stateless JSON responses) and `GET /health`
(liveness — unauthenticated, and it does not read credentials).

Local HTTP without a secret is development-only. It binds `127.0.0.1` only and logs a warning. A non-loopback `MCP_HTTP_HOST` is ignored and the override is logged:

```bash
MCP_TRANSPORT=http MCP_ALLOW_INSECURE_DEV=1 npm run start:http
```

### Docker

The image listens on `0.0.0.0` inside the container (`MCP_HTTP_HOST`) and defaults to `AUTH_MODE=gateway`. Publish the port on loopback and pass the S2S secret. In gateway mode, N-central credentials arrive on each request as headers; they are not read from the environment.

```bash
docker run \
  -e CONDUIT_S2S_SECRET="$CONDUIT_S2S_SECRET" \
  -p 127.0.0.1:8080:8080 \
  ghcr.io/wyre-ai/ncentral-mcp:latest
```

Compose refuses to start when `CONDUIT_S2S_SECRET` is unset. The checked-in gateway service does not set `NCENTRAL_SERVER_URL` or `NCENTRAL_JWT` and does not use `env_file`, so a project `.env` cannot inject static vendor credentials into the container. Compose still interpolates `CONDUIT_S2S_SECRET` from that file. The port publish is `127.0.0.1:8080:8080`:

```bash
CONDUIT_S2S_SECRET="$CONDUIT_S2S_SECRET" docker compose up
```

Single-tenant HTTP (`AUTH_MODE=env`) still requires the S2S secret, then uses `NCENTRAL_SERVER_URL` and `NCENTRAL_JWT`. It is separate from the gateway Compose service:

```bash
docker run \
  -e CONDUIT_S2S_SECRET="$CONDUIT_S2S_SECRET" \
  -e AUTH_MODE=env \
  -e NCENTRAL_SERVER_URL=https://ncentral.example.com \
  -e NCENTRAL_JWT=eyJ... \
  -p 127.0.0.1:8080:8080 \
  ghcr.io/wyre-ai/ncentral-mcp:latest
```

## Gateway mode

Behind the WYRE MCP gateway, set `AUTH_MODE=gateway` (the container default). Every `/mcp` request must include a valid `X-Gateway-S2S` proof and the per-request credential headers:

| Header | Maps to |
|--------|---------|
| `X-Gateway-S2S` | `t=<unix seconds>,v1=<hex hmac-sha256 of t=<unix seconds>>` keyed with `CONDUIT_S2S_SECRET` |
| `x-ncentral-server-url` | `NCENTRAL_SERVER_URL` |
| `x-ncentral-jwt` | `NCENTRAL_JWT` |

```typescript
const response = await fetch('http://gateway:8080/mcp', {
  method: 'POST',
  headers: {
    'x-gateway-s2s': '<proof signed with CONDUIT_S2S_SECRET>',
    'x-ncentral-server-url': 'https://ncentral.example.com',
    'x-ncentral-jwt': 'eyJ...',
  },
});
```

A request missing `x-ncentral-server-url` or `x-ncentral-jwt` gets HTTP 401 and does not fall back to `NCENTRAL_*` in the process environment. When the headers change between requests (different tenant), the internal API client is rebuilt automatically. In `AUTH_MODE=env`, `/mcp` still requires `X-Gateway-S2S`; vendor credentials come from the environment.

## On-prem N-central notes

- **Per-server URL**: N-central is deployed per-installation (self-hosted or N-able
  hosted). There is no shared cloud endpoint — always configure your own server's FQDN.
- **Private CA / self-signed certificates**: if your N-central server's TLS certificate
  is signed by a private CA, mount the CA certificate into the container and point
  Node.js at it:

  ```bash
  docker run \
    -p 127.0.0.1:8080:8080 \
    -v /path/to/ca.pem:/certs/ca.pem:ro \
    -e NODE_EXTRA_CA_CERTS=/certs/ca.pem \
    -e CONDUIT_S2S_SECRET="$CONDUIT_S2S_SECRET" \
    -e AUTH_MODE=env \
    -e NCENTRAL_SERVER_URL=https://ncentral.internal.example.com \
    -e NCENTRAL_JWT=eyJ... \
    ghcr.io/wyre-ai/ncentral-mcp:latest
  ```

  **Never disable TLS verification** (`NODE_TLS_REJECT_UNAUTHORIZED=0`) — it exposes
  your API token to interception. Use `NODE_EXTRA_CA_CERTS` instead.

## NODE_ENV notes

The container sets `NODE_ENV=production`. The server itself does not branch on
`NODE_ENV`; it exists for Node.js ecosystem conventions (dependency pruning, library
behavior). For local development leave it unset. Logging verbosity is controlled by
`LOG_LEVEL`, not `NODE_ENV`.

## Development

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run lint        # eslint 9 flat config
npm test            # vitest (SDK fully mocked — no live server needed)
npm run build       # tsup → dist/
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. Releases are automated with
semantic-release; the container image is published to
`ghcr.io/wyre-ai/ncentral-mcp`.

## License

[Apache-2.0](LICENSE)
