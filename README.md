# SWIM-WebAPI-METAR
> [!CAUTION]
> You have an account authorised by SWIM to retrieve METAR data via the Web API.
> 
> For more details, visit https://top.swim.mlit.go.jp/swim

A TypeScript client library for interacting with Japan's **SWIM (System Wide Information Management)** WebAPI METAR service, operated by the **Ministry of Land, Infrastructure, Transport and Tourism (MLIT)**.

This module provides a typed interface to authenticate and fetch METAR (Meteorological Aerodrome Report) weather observation data in compliance with MLIT's requirements.

## Features

- **Authentication Flow:** Automatically manages POST authentication and session cookies (`MSMSI` and `MSMAI`).
- **Session Lifecycle:** Exposes session serialization methods to support cookie reuse across multiple client instances or runs.
- **TypeScript Support:** Full types for credentials, query options, and client setup.
- **Zero Runtime Dependencies:** Built using modern standard APIs (`fetch` and `Headers`).

---

## Requirements

- An active SWIM portal account authorised by MLIT to use the target Web API service.
- Approval for Web API use may be required by the relevant information service provider before the masked API details are disclosed.
- A server-side JavaScript runtime with `fetch` support, such as Node.js 18 or later.
- The METAR Web API service code disclosed by SWIM after approval, provided as `SWIM_METAR_SERVICE_CODE` or `metarServiceCode`.

## SWIM's WebAPI METAR Restrctions

This package is only a client implementation. Access to SWIM data remains subject to MLIT/SWIM account approval, service approval, and the terms published in the SWIM portal.

- SWIM is intended, for the time being, for aviation-related users such as operators, airport administrators, and government agencies; public/general use is not assumed by SWIM.
- Web API services are request-based HTTP services and require the user to build the client-side system that calls the API.
- Some Web API interface URLs are masked in the public SWIM portal documentation and are disclosed separately after the relevant information service provider approves use.
- The masked METAR service code is not hard-coded. Set `SWIM_METAR_SERVICE_CODE` or pass `metarServiceCode` when constructing `SwimClient`.
- This library is designed for Node.js, Edge Functions, or a proxy server. Browser clients cannot reliably set the required `Cookie` header for cross-origin SWIM requests.
- Do not use this package, or SWIM METAR data retrieved with it, beyond the scope permitted by your SWIM account and service approval.

References:

- [SWIM portal](https://top.swim.mlit.go.jp/swim)
- [SWIM FAQ](https://top.swim.mlit.go.jp/swim/help)
- [SWIM service list](https://top.swim.mlit.go.jp/swim/servicelist)

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
- `options.metarServiceCode`: METAR Web API service code disclosed by SWIM after approval. Defaults to `process.env.SWIM_METAR_SERVICE_CODE` when available.
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
export SWIM_METAR_SERVICE_CODE="webapi-metar-service-code"
npm run demo
```

---

## Japanese / 日本語

### 概要

国土交通省航空局の SWIM Web API から METAR データを取得するための TypeScript クライアントライブラリです。

### 利用条件と制限

- 対象の Web API サービスを利用できる SWIM アカウントと、必要な利用承認が必要です。
- SWIM は当面、運航者、空港管理者、官公庁などの航空関係者による利用を想定しており、一般利用は想定されていません。
- Web API 方式のサービスは HTTP によるリクエスト型のサービスであり、利用者側で API を呼び出すシステムを構築する必要があります。
- SWIM portal で公開されている API 連携仕様書では、Web API の URL の一部がマスクされている場合があります。該当情報は、情報サービス提供者による利用承認後に通知されます。
- マスクされた METAR サービスコードはコード内に固定していません。`SWIM_METAR_SERVICE_CODE` を設定するか、`SwimClient` の `metarServiceCode` に指定してください。
- ブラウザではクロスオリジンリクエスト時に `Cookie` ヘッダーを自由に設定できないため、このライブラリは Node.js、Edge Functions、またはプロキシサーバー上での利用を想定しています。
- 取得した METAR データは、SWIM アカウントおよびサービス利用承認の範囲内で利用してください。

## Author
halka
