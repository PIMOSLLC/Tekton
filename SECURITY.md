# Security policy

## Reporting a vulnerability

Report vulnerabilities privately to **info@phoenixinceptionsmediallc.com**
(Phoenix Inceptions Media LLC). Please do not open a public issue for an
unreleased vulnerability.

Include what you can of the usual triage basics: an affected component, a
minimal reproduction, impact assessment, and environment details. Reports are
acknowledged and triaged within two weeks; sensitive findings get coordinated
disclosure credit on request.

## Supported versions

| Version | Supported |
|---|---|
| 0.1.x | ✅ current |
| earlier | ❌ — patch up to 0.1.x |

## Threat model notes

What ships in a release and where risk lives:

- **The exported blueprint HTML is static, self-contained content** — no
  network calls, so rendering a blueprint is local-only behavior. Documents
  are author-controlled files; treat untrusted `.yaml`/`.json` like you would
  untrusted media: the parsers (serde + the web-side loaders) fail closed on
  malformed input, but local file hygiene still applies.
- **The engine runs in-memory only** — `blueprint-core` has no I/O; nothing
  in the engine reads disks or networks. The CLI reads the document you pass
  and writes the output file you specify; the desktop shell uses the OS
  WebView2/WebKit runtimes with a strict CSP.
- **Autosaved browser work** lives in that browser's localStorage only —
  browser-mode is the container/preview path; nothing syncs anywhere.