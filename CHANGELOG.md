## [Unreleased]


### Added

* **registry:** MCP Registry OCI package configuration for `io.github.WYRE-AI/ncentral-mcp`: `server.json` (stdio via `ghcr.io/wyre-ai/ncentral-mcp:vX.Y.Z`) and the release path through `WYRE-AI/reusable-workflows` `mcp-server-release.yml`, which pushes the versioned image tag and publishes the stamped `server.json` ([#27](https://github.com/WYRE-AI/ncentral-mcp/pull/27))

## [1.0.3](https://github.com/wyre-technology/ncentral-mcp/compare/v1.0.2...v1.0.3) (2026-07-29)


### Bug Fixes

* **security:** close cross-tenant server-ref misroute via AsyncLocalStorage ([#4](https://github.com/wyre-technology/ncentral-mcp/issues/4)) ([f6fb308](https://github.com/wyre-technology/ncentral-mcp/commit/f6fb308cb99f2214cc3dace4a2bd236bda3754ae))

## [1.0.2](https://github.com/wyre-technology/ncentral-mcp/compare/v1.0.1...v1.0.2) (2026-07-23)


### Bug Fixes

* **security:** request-scoped credentials via AsyncLocalStorage to close cross-tenant leak ([#2](https://github.com/wyre-technology/ncentral-mcp/issues/2)) ([7a7358a](https://github.com/wyre-technology/ncentral-mcp/commit/7a7358a3869db4dcae2da5213af7c1e1334a4ad6))

## [1.0.1](https://github.com/wyre-technology/ncentral-mcp/compare/v1.0.0...v1.0.1) (2026-07-06)


### Bug Fixes

* expose all tools flat in tools/list to match fleet (conduit compatibility) ([#1](https://github.com/wyre-technology/ncentral-mcp/issues/1)) ([daee31f](https://github.com/wyre-technology/ncentral-mcp/commit/daee31f6aa64f90037343f4d4795c83e14cdddf1))

# 1.0.0 (2026-07-03)


### Bug Fixes

* align domain handlers with published node-ncentral SDK signatures ([1d927b7](https://github.com/wyre-technology/ncentral-mcp/commit/1d927b78a8349d4834d2cb669f451963eb0e7e54))
* **ci:** grant packages:read to release job so npm ci can read @wyre-technology/node-ncentral ([2681def](https://github.com/wyre-technology/ncentral-mcp/commit/2681def01dbcd58fc21db153576400fa8b4150d5))
* **deps:** resolve @wyre-technology/node-ncentral@1.0.0 from GitHub Packages in lockfile ([e239c0d](https://github.com/wyre-technology/ncentral-mcp/commit/e239c0d9a4bd3534e0777984ee9505f173c3463b))
* install published node-ncentral@1.0.0 and align with real SDK behavior ([3741d1c](https://github.com/wyre-technology/ncentral-mcp/commit/3741d1cc21840734fe525105f27d74855f304cc2))


### Features

* domain handlers, decision-tree navigation, stdio + stateless HTTP transports ([75bcf93](https://github.com/wyre-technology/ncentral-mcp/commit/75bcf930acbfc2930fbf0b24a30fb40b95aecf15))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Expose all tools flat in `tools/list` to match the deployed fleet (Conduit
  compatibility). `tools/list` now always returns the full set (informational
  helpers plus every domain tool) and `tools/call` routes purely by tool name —
  a prior `ncentral_navigate` is no longer required. Replaces the previous
  per-session decision-tree navigation that surfaced only the navigation tools
  until a domain was selected.

### Removed

- `ncentral_back` tool and the per-session navigation state machine — obsolete
  under flat tool exposure. `ncentral_navigate` is retained as an optional,
  informational helper (its `domain` argument is now optional).

### Added

- Initial N-central MCP server with the `ncentral_navigate` and `ncentral_status`
  helper tools.
- Domains: system, orgs, devices, monitoring, tasks, custom-properties, maintenance,
  access-groups (37 tools total).
- Stdio and stateless Streamable HTTP transports; gateway credential injection via
  `x-ncentral-server-url` / `x-ncentral-jwt` headers.
- Elicitation support: device-list scope narrowing, confirmation prompts for direct
  task execution and maintenance window deletion.
- Destructive tool annotations per fleet policy (HIGH-IMPACT / IRREVERSIBLE tiers).
- Explicit "No X found" errors for empty results (anti-hallucination).
- Dockerfile (node:22-alpine, GHCR), semantic-release, CI release workflow.

[Unreleased]: https://github.com/wyre-technology/ncentral-mcp/commits/main
