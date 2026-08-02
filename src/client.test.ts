import assert from 'node:assert/strict';
import test from 'node:test';

import { SwimClient } from './index.js';

const session = { MSMSI: 'session-id', MSMAI: 'auth-id' };

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  });
}

test('getWeather returns the original API JSON without transformation', async () => {
  interface ApiPayload {
    error_info: Array<{ error_code: string; error_description: string }>;
    data: Array<{ location: string; atisinfo: string[]; extra: { preserved: boolean } }>;
    top_level_extension: string[];
  }

  const original: ApiPayload = {
    error_info: [{ error_code: '0', error_description: '' }],
    data: [{ location: 'RJTT', atisinfo: ['ATIS RJTT A'], extra: { preserved: true } }],
    top_level_extension: ['preserved'],
  };

  let requestedUrl = '';
  let requestedInit: RequestInit | undefined;
  const client = new SwimClient({
    session,
    fetch: async (input, init) => {
      requestedUrl = String(input);
      requestedInit = init;
      return jsonResponse(original);
    },
  });

  const result = await client.getWeather<ApiPayload>({ location: ['rjtt', 'RJCC'], dispcnt: 3 });

  assert.equal(requestedUrl, 'https://web.swim.mlit.go.jp/f2atrq/web/FLV402001?location=RJTT%2CRJCC&dispcnt=3');
  assert.equal(requestedInit?.method, 'GET');
  assert.equal((requestedInit?.headers as Record<string, string>).Cookie, 'MSMSI=session-id; MSMAI=auth-id');
  assert.deepEqual(result, original);
});

test('uses the default dispcnt and trims a custom base URL', async () => {
  let requestedUrl = '';
  const client = new SwimClient({
    dataBaseUrl: 'https://example.test///',
    session,
    fetch: async (input) => {
      requestedUrl = String(input);
      return jsonResponse({ ok: true });
    },
  });

  await client.getWeather({ location: 'rjtt' });
  assert.equal(requestedUrl, 'https://example.test/f2atrq/web/FLV402001?location=RJTT&dispcnt=5');
});

test('validates dispcnt against the official 1 through 50 range', async () => {
  const client = new SwimClient({ session, fetch: async () => assert.fail('fetch must not run') });

  await assert.rejects(client.getWeather({ location: 'RJTT', dispcnt: 0 }), /1 through 50/);
  await assert.rejects(client.getWeather({ location: 'RJTT', dispcnt: 51 }), /1 through 50/);
  await assert.rejects(client.getWeather({ location: 'RJTT', dispcnt: 1.5 }), /1 through 50/);
});

test('validates and normalizes ICAO locations', async () => {
  const client = new SwimClient({ session, fetch: async () => assert.fail('fetch must not run') });

  await assert.rejects(client.getWeather({ location: '', dispcnt: 1 }), /at least one/);
  await assert.rejects(client.getWeather({ location: 'RJ8', dispcnt: 1 }), /four-character/);
});

test('returns HTTP 200 business-error JSON unchanged', async () => {
  const original = { error_info: [{ error_code: '4', error_description: 'RJ88' }] };
  const client = new SwimClient({ session, fetch: async () => jsonResponse(original) });

  assert.deepEqual(await client.getWeather({ location: 'RJ88', dispcnt: 1 }), original);
});

test('throws for HTTP-level failures', async () => {
  const client = new SwimClient({
    session,
    fetch: async () => new Response('{}', { status: 403, statusText: 'Forbidden' }),
  });

  await assert.rejects(client.getWeather({ location: 'RJTT', dispcnt: 1 }), /403 Forbidden/);
});

test('requires authentication before requesting weather data', async () => {
  const client = new SwimClient({ fetch: async () => assert.fail('fetch must not run') });
  await assert.rejects(client.getWeather({ location: 'RJTT' }), /Authentication required/);
});

test('login trims the ID and extracts both required cookies', async () => {
  let requestBody = '';
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', 'MSMSI=one; Path=/; Secure; HttpOnly');
  headers.append('Set-Cookie', 'MSMAI=two; Path=/; Secure; HttpOnly');

  const client = new SwimClient({
    fetch: async (_input, init) => {
      requestBody = String(init?.body);
      return new Response('{}', { status: 200, headers });
    },
  });

  assert.deepEqual(await client.login({ id: ' user@example.com ', password: 'secret' }), {
    MSMSI: 'one',
    MSMAI: 'two',
  });
  assert.deepEqual(JSON.parse(requestBody), { id: 'user@example.com', password: 'secret' });
});

test('session getters do not expose mutable internal state', () => {
  const client = new SwimClient({ session });
  const copy = client.getSession();
  assert.ok(copy);
  copy.MSMSI = 'changed';
  assert.equal(client.getSession()?.MSMSI, 'session-id');

  client.clearSession();
  assert.equal(client.isAuthenticated(), false);
});
