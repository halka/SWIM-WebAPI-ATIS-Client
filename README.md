# SWIM WebAPI ATIS Client

TypeScript client for the **ATIS Information Request Service** (`FLV402001`) operated by the Civil Aviation Bureau of Japan's Ministry of Land, Infrastructure, Transport and Tourism (MLIT) on SWIM.

The implementation follows **SWIM Service API Integration Specification, Appendix 07 - ATIS Information Request Service, version 1.0.1 (2025-05-30)**.

> [!IMPORTANT]
> This is an **ATIS client**, not a METAR client. The package name is `swim-webapi-atis`.

## ATIS and METAR are different

- **ATIS (Automatic Terminal Information Service)** provides repetitive, current non-control information for aircraft arriving at, departing from, or operating in a terminal area. It can include runway and approach information, operational remarks, frequencies, and meteorological information.
- **METAR** is a standardized aerodrome routine meteorological report. It is a weather observation product, not a terminal operational briefing service.
- An ATIS message may embed or restate a meteorological observation. That does not make the complete ATIS message a METAR report.

The official SWIM response field `atisinfo` contains complete ATIS text. The Appendix 07 sample and the observed SWIM browser output include approach, runway, frequency, operational, and meteorological information. This library therefore returns ATIS strings as supplied and does not expose a METAR data model or claim to retrieve standalone METAR products.

## Supported contract

- `GET https://web.swim.mlit.go.jp/f2atrq/web/FLV402001`
- Required `location`: one ICAO aerodrome location indicator or comma-separated indicators
- Required `dispcnt`: integer from `1` through `50`
- UTF-8 JSON response
- Official response field: `atisinfo`
- HTTP 200 result codes: `0`, `1`, `2`, `3`, `4`, `5`, `6`, `99`

## Locations observed in the SWIM browser portal

The authenticated browser UI showed 23 selectable aerodromes:

```text
RJCC RJCH RJSS
RJAA RJTT RJSN
RJGG RJOO RJBB
RJBE RJOA RJOT
RJOM RJOK RJFF
RJFS RJFU RJFT
RJFO RJFM RJFK
ROAH ROIG
```

This is **not** encoded as a permanent allowlist. The list was observed in the browser UI, not defined as a fixed set by Appendix 07, and may change. The client validates only the four-character ICAO location-indicator form; SWIM remains authoritative for whether a location is currently supported.

See [`docs/portal-observations.md`](docs/portal-observations.md) for the captured list and returned-message analysis.

## Observed return value

A browser query for `RJCH` displayed successive ATIS entries such as `ATIS RJCH H`, `ATIS RJCH G`, and `ATIS RJCH F`. A visible entry contained content of this form:

```text
ATIS RJCH H
M0500
(APCH)ILS Z RWY12
USING RWY 12
SHIRAKAMI APP FREQ 120.85
M
020500Z 14014KT 40KM FEW020CU SCT030CU
23/17 Q1011/A2988=
Q/TWO NINE EIGHT EIGHT
```

Accordingly:

- `dispcnt` is the requested number of ATIS messages per location;
- `atisinfo` is an array of complete ATIS message strings;
- multiple entries can represent successive information identifiers and issue times;
- the meteorological line is embedded inside the ATIS message;
- the client deliberately preserves the raw message instead of parsing it as METAR.

The browser page also displayed a separate “last updated” timestamp. Appendix 07 does not define that UI field in the API response, so it is not included in the TypeScript response model.

## Requirements

- Node.js 18 or newer, or another trusted server-side runtime with Fetch API support
- A valid SWIM account and required service authorization

## Installation

```bash
npm install swim-webapi-atis
```

For repository development:

```bash
npm install
npm run build
npm test
```

## Usage

```typescript
import { SwimApiError, SwimClient } from 'swim-webapi-atis';

const client = new SwimClient();

await client.login({
  id: process.env.SWIM_ID!,
  password: process.env.SWIM_PASSWORD!,
});

try {
  const response = await client.getAtis({
    location: ['RJCH', 'RJTT'],
    dispcnt: 3,
  });

  for (const aerodrome of response.data ?? []) {
    console.log(aerodrome.location);
    for (const atisMessage of aerodrome.atisinfo) {
      console.log(atisMessage);
    }
  }
} catch (error) {
  if (error instanceof SwimApiError) {
    console.error(error.errorInfo);
  } else {
    throw error;
  }
}
```

## API

### `new SwimClient(options?)`

Options:

- `authBaseUrl`: authentication origin; default `https://top.swim.mlit.go.jp`
- `dataBaseUrl`: ATIS service origin; default `https://web.swim.mlit.go.jp`
- `session`: previously obtained `MSMSI` and `MSMAI` values
- `fetch`: custom Fetch implementation for tests or a controlled proxy

The official service path `/f2atrq/web/FLV402001` is fixed by Appendix 07 and is not configurable.

### `login(credentials)`

Authenticates and stores the `MSMSI` and `MSMAI` session cookies.

### `getAtis({ location, dispcnt })`

Requests complete ATIS messages. Client-side validation enforces four-character ICAO aerodrome indicators and the official `dispcnt` range of `1..50`.

Codes `0` and `1` return normally. Codes `2`, `3`, `4`, `5`, `6`, and `99` throw `SwimApiError`, because the service reports these business errors using HTTP 200.

### Session methods

- `isAuthenticated()`
- `getSession()`
- `setSession(session)`
- `clearSession()`
- `getCookieHeader()`

## Response model

```typescript
interface AtisLocationData {
  location: string;
  atisinfo: string[];
}
```

`atisinfo` is the exact wire name from Appendix 07. Each string is an entire ATIS message; no METAR parsing or semantic decomposition is performed.

## OpenAPI

`openapi.yml` documents the Appendix 07 v1.0.1 request, response, and business-error contract. Authentication is included for client usability but is outside Appendix 07 itself.

## Live demo

```bash
export SWIM_ID="your-email@example.com"
export SWIM_PASSWORD="your-password"
npm run demo -- --airport RJCH --count 3
```

## Security

- Use the client on a trusted server, Edge runtime, or controlled proxy.
- Never expose SWIM credentials or session cookies in browser code, logs, or source control.
- Treat live-service tests separately from unit tests.

## References

- MLIT Civil Aviation Bureau, SWIM Service API Integration Specification, Appendix 07, v1.0.1
- ICAO Annex 11 - Air Traffic Services (ATIS belongs to the air traffic services domain)
- ICAO Annex 3 - Meteorological Service for International Air Navigation (METAR belongs to the aeronautical meteorological domain)
- Observed authenticated SWIM browser interface, 2026-08-02; documented separately as non-contractual operational evidence

## Author

halka
