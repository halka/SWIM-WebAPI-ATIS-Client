import assert from 'node:assert/strict';
import test from 'node:test';

import { SwimApiError, SwimClient } from './index.js';

const session = { MSMSI: 'session-id', MSMAI: 'auth-id' };

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  });
}

test('getAtis calls FLV402001 with encoded locations and required dispcnt', async () => {
  let requestedUrl = '';
  let requestedInit: RequestInit | undefined;
  const client = new SwimClient({
    session,
    fetch: async (input, init) => {
      requestedUrl = String(input);
      requestedInit = init;
      return jsonResponse({
        error_info: [{ error_code: '0', error_description: '' }],
        data: [{ location: 'RJTT', atisinfo: ['ATIS RJTT A'] }],
      });
    },
  });

  const result = await client.getAtis({ location: ['rjtt', 'RJCC'], dispcnt: 3 });

  assert.equal(requestedUrl, 'https://web.swim.mlit.go.jp/f2atrq/web/FLV402001?location=RJTT%2CRJCC&dispcnt=3');
  assert.equal(requestedInit?.method, 'GET');
  assert.equal((requestedInit?.headers as Record<string, string>).Cookie, 'MSMSI=session-id; MSMAI=auth-id');
  assert.deepEqual(result.data?.[0]?.atisinfo, ['ATIS RJTT A']);
});

test('validates dispcnt against the official 1 through 50 range', async () => {
  const client = new SwimClient({ session, fetch: async () => assert.fail('fetch must not run') });

  await assert.rejects(client.getAtis({ location: 'RJTT', dispcnt: 0 }), /1 through 50/);
  await assert.rejects(client.getAtis({ location: 'RJTT', dispcnt: 51 }), /1 through 50/);
  await assert.rejects(client.getAtis({ location: 'RJTT', dispcnt: 1.5 }), /1 through 50/);
});

test('validates and normalizes ICAO locations', async () => {
  const client = new SwimClient({ session, fetch: async () => assert.fail('fetch must not run') });

  await assert.rejects(client.getAtis({ location: '', dispcnt: 1 }), /at least one/);
  await assert.rejects(client.getAtis({ location: 'RJ8', dispcnt: 1 }), /four-character/);
});

test('raises documented HTTP 200 business errors as SwimApiError', async () => {
  const client = new SwimClient({
    session,
    fetch: async () => jsonResponse({
      error_info: [{ error_code: '4', error_description: 'RJ88' }],
    }),
  });

  await assert.rejects(
    client.getAtis({ location: 'RJ88', dispcnt: 1 }),
    (error: unknown) => {
      assert.ok(error instanceof SwimApiError);
      assert.equal(error.status, 200);
      assert.equal(error.errorInfo[0]?.error_code, '4');
      assert.match(error.message, /RJ88/);
      return true;
    },
  );
});

test('rejects malformed casing that does not match the official atisinfo field', async () => {
  const client = new SwimClient({
    session,
    fetch: async () => jsonResponse({
      error_info: [{ error_code: '0', error_description: '' }],
      data: [{ location: 'RJTT', atisInfo: ['incorrect field'] }],
    }),
  });

  await assert.rejects(client.getAtis({ location: 'RJTT', dispcnt: 1 }), /malformed location data/);
});

test('requires application/json responses', async () => {
  const client = new SwimClient({
    session,
    fetch: async () => new Response('{}', { status: 200, headers: { 'Content-Type': 'text/plain' } }),
  });

  await assert.rejects(client.getAtis({ location: 'RJTT', dispcnt: 1 }), /Content-Type/);
});

test('login extracts both required cookies', async () => {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', 'MSMSI=one; Path=/; Secure; HttpOnly');
  headers.append('Set-Cookie', 'MSMAI=two; Path=/; Secure; HttpOnly');

  const client = new SwimClient({
    fetch: async () => new Response('{}', { status: 200, headers }),
  });

  assert.deepEqual(await client.login({ id: 'user@example.com', password: 'secret' }), {
    MSMSI: 'one',
    MSMAI: 'two',
  });
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
