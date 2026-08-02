# SWIM WebAPI ATIS Client

TypeScript client for the Japanese MLIT SWIM **ATIS Information Request Service** (`FLV402001`).

This project is aligned with **SWIM Service API Integration Specification, Appendix 07 — ATIS Information Request Service, Ver. 1.0.1 (2025-05-30)**.

The public API is intentionally small:

- authenticate with `login()`;
- restore or clear a session;
- request ATIS JSON with `getAtis()`;
- receive the JSON value returned by SWIM without field renaming, filtering, validation, or reshaping.

No legacy API aliases are provided.

## Requirements

- Node.js 18 or newer, or another trusted server-side runtime with Fetch API support
- A valid SWIM account
- Access to the ATIS Information Request Service
- Network access to the SWIM authentication and service endpoints

Do not expose credentials or session cookies in browser-delivered code.

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

const response = await client.getAtis({
  location: ['RJTT', 'RJCC'],
  dispcnt: 3,
});

console.log(JSON.stringify(response, null, 2));
```

`response` is the value produced by `Response.json()`. The client does not reinterpret SWIM business-error objects returned with HTTP 200.

## Typed consumption

The default return type is `unknown`, because the client preserves the service response rather than imposing a local schema. Applications that maintain their own verified response type can supply it as a generic argument:

```typescript
interface AtisPayload {
  error_info: Array<{
    error_code: string;
    error_description: string;
  }>;
  data?: Array<{
    location: string;
    atisinfo: string[];
  }>;
}

const response = await client.getAtis<AtisPayload>({
  location: 'RJTT',
  dispcnt: 5,
});
```

The generic type is a compile-time assertion only. It does not transform or validate the runtime JSON.

## API

### `new SwimClient(options?)`

Options:

- `authBaseUrl`: authentication origin; defaults to `https://top.swim.mlit.go.jp`
- `dataBaseUrl`: ATIS service origin; defaults to `https://web.swim.mlit.go.jp`
- `session`: existing `MSMSI` and `MSMAI` cookie values
- `fetch`: custom Fetch implementation for tests or controlled proxies

Trailing slashes in custom base URLs are removed.

### `login(credentials)`

Authenticates against `/swim/webapi/login`, stores the `MSMSI` and `MSMAI` cookies, and returns a copy of the session object.

```typescript
const session = await client.login({
  id: 'user@example.com',
  password: 'secret',
});
```

### `getAtis(options)`

Calls:

```text
GET /f2atrq/web/FLV402001
```

Options:

- `location`: one ICAO airport code, a comma-separated string, or an array of codes
- `dispcnt`: number of ATIS records requested per airport; required integer `1..50`

The specification defines both parameters as required. The client therefore does not supply a default `dispcnt`.

Location values are trimmed and converted to uppercase before transmission. Syntax is checked as four alphanumeric characters; SWIM remains authoritative for whether a location exists or is supported.

The method:

- requires an authenticated session;
- throws for non-successful HTTP status codes;
- returns HTTP 200 JSON unchanged, including SWIM business-error objects and additional fields unknown to this package.

### Session methods

- `isAuthenticated()`
- `getSession()`
- `setSession(session)`
- `clearSession()`
- `getCookieHeader()`

Session values are copied when accepted or returned so callers cannot mutate internal state accidentally.

## Service contract

The specification defines:

- API ID: `FLV402001`
- API name: ATIS Information Request
- method: `GET`
- character encoding: UTF-8
- endpoint: `https://web.swim.mlit.go.jp/f2atrq/web/FLV402001`
- required query parameters: `location`, `dispcnt`
- `dispcnt` range: `1..50`
- response content type: `application/json`
- HTTP 200 body fields: `error_info`, `data`, `location`, `atisinfo`

The response field name is exactly `atisinfo`.

## SWIM result codes

The specification represents normal results and business errors with HTTP 200 JSON.

| Code | Meaning |
|---|---|
| `0` | Normal completion |
| `1` | Normal completion, no matching data |
| `2` | Missing `location` parameter |
| `3` | Missing `dispcnt` parameter |
| `4` | Nonexistent location |
| `5` | Too many locations selected |
| `6` | `dispcnt` outside `1..50` |
| `99` | Failure or unexpected error |

The client returns these JSON bodies without converting them into custom exceptions.

## Example program

Set credentials and run the command-line example:

```bash
export SWIM_ID="your-email@example.com"
export SWIM_PASSWORD="your-password"

npm run demo -- --airport RJTT --count 3
npm run demo -- -a RJTT -a RJCC -c 5
npm run demo -- --help
```

Both `--airport` and `--count` are required by the example. The program prints the complete JSON value returned by SWIM.

## Error handling

```typescript
try {
  const response = await client.getAtis({
    location: 'RJTT',
    dispcnt: 3,
  });
  console.log(response);
} catch (error) {
  console.error(error);
}
```

HTTP failures, invalid client-side options, missing authentication, and unusable login responses throw errors. A SWIM business error represented as JSON with HTTP 200 is returned to the caller without conversion into a custom exception.

## OpenAPI

`openapi.yml` documents the Appendix 07 request and response contract. It models the specified response fields while allowing additional properties so that the runtime response remains unmodified.

Authentication is included for client usability; Appendix 07 itself specifies the ATIS information request interface.

## Security

- Run the client in a trusted server-side environment.
- Never commit credentials or cookies.
- Avoid logging authentication material.
- Treat sessions as secrets and refresh them according to current SWIM policy.

## Official references

- SWIM portal: https://top.swim.mlit.go.jp/swim/
- SWIM service list: https://top.swim.mlit.go.jp/swim/servicelist
- SWIM FAQ: https://top.swim.mlit.go.jp/swim/help
- MLIT Civil Aviation Bureau, *SWIM Service API Integration Specification, Appendix 07 — ATIS Information Request Service*, Ver. 1.0.1, 2025-05-30

## Author

halka
