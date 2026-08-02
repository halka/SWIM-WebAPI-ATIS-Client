# SWIM WebAPI ATIS Client

TypeScript client for the **ATIS Information Request Service** (`FLV402001`) operated on SWIM by the Civil Aviation Bureau of Japan's Ministry of Land, Infrastructure, Transport and Tourism (MLIT).

The implementation follows **SWIM Service API Integration Specification, Appendix 07 - ATIS Information Request Service, version 1.0.1 (2025-05-30)**.

> [!IMPORTANT]
> The public API is `getWeather()`. It returns the JSON value supplied by the SWIM API without renaming fields, validating the response schema, filtering properties, or converting business-error payloads into custom objects.

## Requirements

- Node.js 18 or newer, or another trusted server-side runtime with Fetch API support
- A valid SWIM account
- ATIS Information Request Service access enabled for that account
- Network access to the SWIM authentication and data-service origins

Do not place SWIM credentials or session cookies in browser-delivered code.

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

## Quick start

```typescript
import { SwimClient } from 'swim-webapi-atis';

const client = new SwimClient();

await client.login({
  id: process.env.SWIM_ID!,
  password: process.env.SWIM_PASSWORD!,
});

const response = await client.getWeather({
  location: ['RJCH', 'RJTT'],
  dispcnt: 3,
});

console.log(JSON.stringify(response, null, 2));
```

## API

### `new SwimClient(options?)`

Options:

- `authBaseUrl`: authentication origin; default `https://top.swim.mlit.go.jp`
- `dataBaseUrl`: ATIS service origin; default `https://web.swim.mlit.go.jp`
- `session`: previously obtained `MSMSI` and `MSMAI` values
- `fetch`: custom Fetch implementation for tests or a controlled proxy

The service path `/f2atrq/web/FLV402001` is fixed.

### `login(credentials): Promise<SwimSession>`

Authenticates and stores the `MSMSI` and `MSMAI` session cookies.

### `getWeather(options): Promise<unknown>`

Requests SWIM ATIS/weather information.

```typescript
interface GetWeatherOptions {
  location: string | string[];
  dispcnt: number;
}
```

Client-side request validation:

- `location` is normalized to uppercase and must contain four-character ICAO location indicators.
- `dispcnt` must be an integer from `1` through `50`.

Response behavior:

- For HTTP success responses, `getWeather()` returns the exact value produced by `response.json()`.
- Response keys and nested structures are not transformed.
- Unknown or additional properties are preserved.
- SWIM business-error JSON returned with HTTP 200 is returned normally and is not converted into an exception.
- HTTP-level failures still throw an `Error` containing the status code and status text.

Callers should narrow or validate the returned `unknown` value according to their own requirements.

### Session methods

- `isAuthenticated()`
- `getSession()`
- `setSession(session)`
- `clearSession()`
- `getCookieHeader()`

## Wire contract

- `GET https://web.swim.mlit.go.jp/f2atrq/web/FLV402001`
- Required `location`: one ICAO aerodrome location indicator or comma-separated indicators
- Required `dispcnt`: integer from `1` through `50`
- JSON response returned without client-side transformation

The API commonly returns fields such as `error_info`, `data`, `location`, and `atisinfo`, but this library deliberately does not impose a fixed TypeScript response model. The service response is authoritative.

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
- Re-authenticate according to SWIM's current session policy; do not assume a session remains valid indefinitely.

## References

Official SWIM sources:

- [SWIM portal](https://top.swim.mlit.go.jp/swim/)
- [SWIM service list](https://top.swim.mlit.go.jp/swim/servicelist)
- [SWIM FAQ](https://top.swim.mlit.go.jp/swim/help)
- [SWIM notices](https://top.swim.mlit.go.jp/swim/notice)
- MLIT Civil Aviation Bureau, *SWIM Service API Integration Specification, Appendix 07 - ATIS Information Request Service*, v1.0.1
- MLIT Civil Aviation Bureau, *SWIM Service API Integration Specification - Common Part*

## Author

halka
