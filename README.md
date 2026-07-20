# SWIM-WebAPI-METAR
> [!CAUTION]
> You have an account authorised by SWIM to retrieve METAR data via the Web API.
> 
> For more details, visit https://top.swim.mlit.go.jp/swim

A TypeScript client library for interacting with Japan's **SWIM (System Wide Information Management)** WebAPI METAR service, operated by the **Ministry of Land, Infrastructure, Transport and Tourism (MLIT)**.

This module provides a typed interface to authenticate and fetch METAR (Meteorological Aerodrome Report) weather observation data in compliance with MLIT's requirements.

## Requirements
**MLIT's Authorised**

## Features

- **Authentication Flow:** Automatically manages POST authentication and session cookies (`MSMSI` and `MSMAI`).
- **Session Lifecycle:** Exposes session serialization methods to support cookie reuse across multiple client instances or runs.
- **TypeScript Support:** Full types for credentials, query options, and client setup.
- **Zero Runtime Dependencies:** Built using modern standard APIs (`fetch` and `Headers`).

---

## Installation

Within the project folder, install dev dependencies and compile:

```bash
# Install dependencies
npm install

# Build the module
npm run build
```

---

## Quick Start (Node.js)

```typescript
import { SwimClient } from 'swim-webapi-metar';

// Initialize the client
const client = new SwimClient();

try {
  // 1. Authenticate with SWIM credentials
  await client.login({
    id: 'your-email@example.com',
    password: 'your-password'
  });

  console.log('Successfully authenticated!');

  // 2. Retrieve METAR data for Haneda (RJTT) and Hakodate (RJCH)
  const metarData = await client.getMetar({
    location: ['RJTT', 'RJCH'],
    dispcnt: 5 // number of records to return per airport
  });

  console.log('METAR Data:', metarData);
} catch (error) {
  console.error('Error fetching METAR data:', error);
}
```

### Reusing a Session

You can extract session cookies after authentication and load them into a new client instance later to avoid logging in on every request:

```typescript
// Get current session
const session = client.getSession(); // returns { MSMSI, MSMAI }

// Later, restore the session in a new instance
const restoredClient = new SwimClient({ session });
```

---

## API Reference

### `class SwimClient`

#### `constructor(options?: SwimClientOptions)`
Creates an instance of the SWIM client.
- `options.authBaseUrl`: Custom base URL for authentication. Defaults to `https://top.swim.mlit.go.jp`.
- `options.dataBaseUrl`: Custom base URL for data services. Defaults to `https://web.swim.mlit.go.jp`.
- `options.session`: Initial session cookies (`SwimSession`).
- `options.fetch`: Custom `fetch` implementation.

#### `login(credentials: SwimCredentials): Promise<SwimSession>`
Authenticates via the `/swim/webapi/login` endpoint, saving session cookies in the instance.
- `credentials.id`: Your registered email address.
- `credentials.password`: Your SWIM account password.

#### `getMetar(options: GetMetarOptions): Promise<MetarResponse>`
Retrieves weather report data for the specified airports.
- `options.location`: Comma-separated string or an array of airport ICAO codes (e.g. `['RJTT', 'RJCH']`).
- `options.dispcnt`: Number of METAR records to retrieve per location.

#### `isAuthenticated(): boolean`
Returns `true` if the client currently holds session cookies.

#### `getSession(): SwimSession | undefined`
Returns the active session cookies.

#### `setSession(session: SwimSession): void`
Manually sets or replaces the active session cookies.

---

## Verification & Development

### Run Unit Tests
A suite of tests is implemented using Node's native test runner (via `tsx` to support ESM TypeScript):
```bash
npm test
```

### Run Executable Demo
You can run the demo script directly. Passing credentials in environment variables will execute against MLIT's live environment:
```bash
# To test against the live service:
export SWIM_ID="your-email@example.com"
export SWIM_PASSWORD="your-password"
npm run demo
```

---

## Environment Constraints

> [!WARNING]
> Because browsers restrict manually setting the `Cookie` header on cross-origin requests for security reasons, this library is primarily designed for **Node.js (server-side)**, **Edge Functions**, or **proxy server** environments. If used directly in client-side browser environments, it may trigger CORS and header modification issues unless requests are routed through a reverse proxy.

## Author
halka
