import {
  AtisResponse,
  GetAtisOptions,
  SwimClientOptions,
  SwimCredentials,
  SwimSession,
} from './types.js';

const DEFAULT_AUTH_BASE_URL = 'https://top.swim.mlit.go.jp';
const DEFAULT_DATA_BASE_URL = 'https://web.swim.mlit.go.jp';
const LOGIN_PATH = '/swim/webapi/login';
const ATIS_PATH = '/f2atrq/web/FLV402001';
const LOCATION_PATTERN = /^[A-Z0-9]{4}$/;
const MIN_DISPLAY_COUNT = 1;
const MAX_DISPLAY_COUNT = 50;

export class SwimClient {
  private readonly authBaseUrl: string;
  private readonly dataBaseUrl: string;
  private readonly fetchFn: typeof fetch;
  private session?: SwimSession;

  constructor(options: SwimClientOptions = {}) {
    this.authBaseUrl = normalizeBaseUrl(options.authBaseUrl ?? DEFAULT_AUTH_BASE_URL);
    this.dataBaseUrl = normalizeBaseUrl(options.dataBaseUrl ?? DEFAULT_DATA_BASE_URL);
    this.fetchFn = options.fetch ?? fetch;
    this.session = options.session ? validateAndCopySession(options.session) : undefined;
  }

  public setSession(session: SwimSession): void {
    this.session = validateAndCopySession(session);
  }

  public clearSession(): void {
    this.session = undefined;
  }

  public getSession(): SwimSession | undefined {
    return this.session ? { ...this.session } : undefined;
  }

  public isAuthenticated(): boolean {
    return this.session !== undefined;
  }

  public getCookieHeader(): string | undefined {
    const session = this.session;
    return session ? `MSMSI=${session.MSMSI}; MSMAI=${session.MSMAI}` : undefined;
  }

  public async login(credentials: SwimCredentials): Promise<SwimSession> {
    const validatedCredentials = validateCredentials(credentials);
    const response = await this.fetchFn(`${this.authBaseUrl}${LOGIN_PATH}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(validatedCredentials),
    });

    assertSuccessfulResponse(response, 'Login');

    const session = await extractSession(response);
    this.session = session;
    return { ...session };
  }

  /**
   * Calls the SWIM ATIS Information Request API and returns the decoded JSON
   * without renaming, filtering, validating, or reshaping response fields.
   */
  public async getAtis<TResponse = AtisResponse>(options: GetAtisOptions): Promise<TResponse> {
    const cookie = this.getCookieHeader();
    if (!cookie) {
      throw new Error('Authentication required. Call login() or setSession() first.');
    }

    const query = createAtisQuery(options);
    const response = await this.fetchFn(`${this.dataBaseUrl}${ATIS_PATH}?${query}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Cookie: cookie,
      },
    });

    assertSuccessfulResponse(response, 'ATIS request');
    return await response.json() as TResponse;
  }
}

function validateCredentials(credentials: SwimCredentials): SwimCredentials {
  const id = credentials?.id?.trim();
  if (!id) {
    throw new TypeError('credentials.id is required.');
  }
  if (typeof credentials.password !== 'string' || !credentials.password) {
    throw new TypeError('credentials.password is required.');
  }
  return { id, password: credentials.password };
}

function createAtisQuery(options: GetAtisOptions): string {
  const { locations, dispcnt } = validateAtisOptions(options);
  return new URLSearchParams({
    location: locations.join(','),
    dispcnt: String(dispcnt),
  }).toString();
}

function validateAtisOptions(options: GetAtisOptions): { locations: string[]; dispcnt: number } {
  if (!options || options.location === undefined || options.location === null) {
    throw new TypeError('location is required.');
  }

  const rawLocations = Array.isArray(options.location) ? options.location : options.location.split(',');
  const locations = rawLocations.map((value) => value.trim().toUpperCase());

  if (locations.length === 0 || locations.some((value) => !value)) {
    throw new TypeError('location must contain at least one ICAO aerodrome code.');
  }

  const invalidLocation = locations.find((value) => !LOCATION_PATTERN.test(value));
  if (invalidLocation) {
    throw new RangeError(`location must contain four-character ICAO aerodrome codes: ${invalidLocation}`);
  }

  if (!Number.isInteger(options.dispcnt) || options.dispcnt < MIN_DISPLAY_COUNT || options.dispcnt > MAX_DISPLAY_COUNT) {
    throw new RangeError(`dispcnt must be an integer from ${MIN_DISPLAY_COUNT} through ${MAX_DISPLAY_COUNT}.`);
  }

  return { locations, dispcnt: options.dispcnt };
}

async function extractSession(response: Response): Promise<SwimSession> {
  const values = parseSetCookieValues(readSetCookieHeaders(response.headers));

  if (!values.has('MSMSI') || !values.has('MSMAI')) {
    await mergeSessionValuesFromJson(response, values);
  }

  return validateAndCopySession({
    MSMSI: values.get('MSMSI') ?? '',
    MSMAI: values.get('MSMAI') ?? '',
  });
}

function parseSetCookieValues(cookies: string[]): Map<string, string> {
  const values = new Map<string, string>();
  for (const cookie of cookies) {
    const firstPart = cookie.split(';', 1)[0]?.trim();
    const separator = firstPart?.indexOf('=') ?? -1;
    if (!firstPart || separator < 1) continue;
    values.set(firstPart.slice(0, separator).trim(), firstPart.slice(separator + 1).trim());
  }
  return values;
}

async function mergeSessionValuesFromJson(response: Response, values: Map<string, string>): Promise<void> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) return;

  const body = await response.json() as Record<string, unknown>;
  if (typeof body.MSMSI === 'string') values.set('MSMSI', body.MSMSI);
  if (typeof body.MSMAI === 'string') values.set('MSMAI', body.MSMAI);
}

function readSetCookieHeaders(headers: Headers): string[] {
  const extendedHeaders = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof extendedHeaders.getSetCookie === 'function') {
    return extendedHeaders.getSetCookie();
  }
  const value = headers.get('set-cookie');
  return value ? value.split(/,(?=[^;]*=)/) : [];
}

function validateAndCopySession(session: SwimSession): SwimSession {
  if (!session || typeof session.MSMSI !== 'string' || !session.MSMSI) {
    throw new TypeError('session.MSMSI is required.');
  }
  if (typeof session.MSMAI !== 'string' || !session.MSMAI) {
    throw new TypeError('session.MSMAI is required.');
  }
  return { MSMSI: session.MSMSI, MSMAI: session.MSMAI };
}

function assertSuccessfulResponse(response: Response, operation: string): void {
  if (!response.ok) {
    const suffix = response.statusText ? ` ${response.statusText}` : '';
    throw new Error(`${operation} failed with HTTP ${response.status}${suffix}.`);
  }
}

function normalizeBaseUrl(value: string): string {
  const normalized = value.trim().replace(/\/+$/, '');
  if (!normalized) {
    throw new TypeError('Base URL must not be empty.');
  }
  return normalized;
}
