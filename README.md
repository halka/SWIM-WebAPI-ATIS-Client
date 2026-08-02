# SWIM WebAPI ATIS Client

TypeScript client for the Japanese MLIT SWIM ATIS Information Request Service (`FLV402001`).

The public API is intentionally small:

- authenticate with `login()`;
- restore or clear a session;
- request ATIS/weather JSON with `getWeather()`;
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

const response = await client.getWeather({
  location: ['RJTT', 'RJCC'],
  dispcnt: 3,
});

console.log(JSON.stringify(response, null, 2));
```

`response` is the value produced by the platform's `Response.json()` implementation. The client does not reinterpret SWIM business-error objects returned with HTTP 200.

## Typed consumption

The default return type is `unknown`, because the library preserves the service response rather than imposing a local schema. Applications that maintain their own verified response type can supply it as a generic argument:

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

const response = await client.getWeather<AtisPayload>({
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

### `getWeather(options)`

Calls:

```text
GET /f2atrq/web/FLV402001
```

Options:

- `location`: one ICAO aerodrome code, a comma-separated string, or an array of codes
- `dispcnt`: records requested per aerodrome; integer `1..50`, default `5`

Location values are trimmed and converted to uppercase before transmission. Syntax is checked as four alphanumeric characters; SWIM remains authoritative for actual support.

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

## Example program

Set credentials and run the command-line example:

```bash
export SWIM_ID="your-email@example.com"
export SWIM_PASSWORD="your-password"

npm run demo -- --airport RJTT --count 3
npm run demo -- -a RJTT -a RJCC -c 5
npm run demo -- --help
```

The example prints the complete JSON value returned by SWIM.

## Error handling

```typescript
try {
  const response = await client.getWeather({ location: 'RJTT' });
  console.log(response);
} catch (error) {
  console.error(error);
}
```

HTTP failures, invalid options, missing authentication, and unusable login responses throw errors. A SWIM business error represented as JSON with HTTP 200 is returned to the caller without conversion into a custom exception.

## OpenAPI

`openapi.yml` documents the service endpoint and request parameters. The response schema is intentionally open because the client returns the original JSON rather than enforcing a locally narrowed representation.

## Security

- Run the client in a trusted server-side environment.
- Never commit credentials or cookies.
- Avoid logging authentication material.
- Treat sessions as secrets and refresh them according to current SWIM policy.

## Official references

- SWIM portal: https://top.swim.mlit.go.jp/swim/
- SWIM service list: https://top.swim.mlit.go.jp/swim/servicelist
- SWIM FAQ: https://top.swim.mlit.go.jp/swim/help
- MLIT Civil Aviation Bureau, SWIM Service API Integration Specification, Appendix 07 — ATIS Information Request Service

## Author

halka
