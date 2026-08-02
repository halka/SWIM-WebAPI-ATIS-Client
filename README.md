# SWIM WebAPI ATIS Client

TypeScript client for the **ATIS Information Request Service** operated by the Civil Aviation Bureau of Japan's Ministry of Land, Infrastructure, Transport and Tourism (MLIT) on SWIM.

This implementation follows **SWIM Service API Integration Specification, Appendix 07 - ATIS Information Request Service, version 1.0.1 (2025-05-30)** for API `FLV402001`.

> [!CAUTION]
> A SWIM account and any required service authorization are your responsibility. Do not expose credentials or session cookies in browser code, logs, or source control.

## Supported contract

- `GET https://web.swim.mlit.go.jp/f2atrq/web/FLV402001`
- Required `location`: one ICAO airport code or comma-separated codes
- Required `dispcnt`: integer from `1` through `50`
- UTF-8 JSON response
- Official response field: `atisinfo`
- HTTP 200 business result codes: `0`, `1`, `2`, `3`, `4`, `5`, `6`, `99`

The package name and `getMetar()` method are retained for compatibility with earlier releases. The official Appendix 07 service is ATIS, so new code should use `getAtis()`.

## Requirements

- Node.js 18 or newer, or another server-side runtime with Fetch API support
- A valid SWIM account and required authorization

## Installation

```bash
npm install
npm run build
npm test
```

## Usage

```typescript
import { SwimApiError, SwimClient } from 'swim-webapi-metar';

const client = new SwimClient();

await client.login({
  id: process.env.SWIM_ID!,
  password: process.env.SWIM_PASSWORD!,
});

try {
  const response = await client.getAtis({
    location: ['RJTT', 'RJCC'],
    dispcnt: 3,
  });

  for (const airport of response.data ?? []) {
    console.log(airport.location, airport.atisinfo);
  }
} catch (error) {
  if (error instanceof SwimApiError) {
    console.error(error.errorInfo);
  } else {
    throw error;
  }
}
```

## Session reuse

```typescript
const session = client.getSession();
const restored = new SwimClient({ session });

restored.clearSession();
```

The client requires both SWIM cookies, `MSMSI` and `MSMAI`.

## API

### `new SwimClient(options?)`

Relevant options:

- `authBaseUrl`: authentication host; default `https://top.swim.mlit.go.jp`
- `dataBaseUrl`: service host; default `https://web.swim.mlit.go.jp`
- `atisServiceCode`: path segment before `/web/FLV402001`; default `f2atrq`
- `metarServiceCode`: deprecated alias for `atisServiceCode`
- `session`: previously obtained `MSMSI` and `MSMAI` values
- `fetch`: custom Fetch implementation, useful for tests and proxies

Environment fallback variables are `SWIM_ATIS_SERVICE_CODE`, then the deprecated `SWIM_METAR_SERVICE_CODE`.

### `login(credentials)`

Authenticates and stores the `MSMSI` and `MSMAI` session cookies.

### `getAtis({ location, dispcnt })`

Calls `FLV402001`. Client-side validation prevents malformed locations and `dispcnt` values outside `1..50`.

Codes `0` and `1` are returned normally. Codes `2`, `3`, `4`, `5`, `6`, and `99` throw `SwimApiError`, because the official service reports these business errors using HTTP 200.

### `getMetar(options)`

Deprecated compatibility alias for `getAtis(options)`.

### Session methods

- `isAuthenticated()`
- `getSession()`
- `setSession(session)`
- `clearSession()`
- `getCookieHeader()`

## Response types

```typescript
interface AtisLocationData {
  location: string;
  atisinfo: string[];
}

interface AtisErrorInfo {
  error_code: string;
  error_description: string;
}
```

The exact wire name is `atisinfo`, not `atisInfo`.

## OpenAPI

`openapi.yml` documents the Appendix 07 v1.0.1 request, response, and business error contract. Authentication is included for client usability but is outside the scope of Appendix 07 itself.

## Live demo

```bash
export SWIM_ID="your-email@example.com"
export SWIM_PASSWORD="your-password"
npm run demo -- --airport RJTT,RJCC --count 3
```

## Security notes

- Use this library on a trusted server, Edge runtime, or controlled proxy.
- Never commit SWIM credentials or session cookies.
- Avoid printing cookie values in production logs.
- Treat live-service tests separately from unit tests.

## Author

halka
