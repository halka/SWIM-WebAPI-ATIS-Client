import {
  AtisErrorInfo,
  AtisResponse,
  GetAtisOptions,
  SwimClientOptions,
  SwimCredentials,
  SwimSession,
} from './types.js';

const ATIS_PATH = '/f2atrq/web/FLV402001';
const LOCATION_PATTERN = /^[A-Z0-9]{4}$/;

export class SwimApiError extends Error {
  public readonly errorInfo: AtisErrorInfo[];
  public readonly response: AtisResponse;
  public readonly status: number;

  constructor(message: string, response: AtisResponse, status = 200) {
    super(message);
    this.name = 'SwimApiError';
    this.errorInfo = response.error_info;
    this.response = response;
    this.status = status;
  }
}

export class SwimClient {
  private readonly authBaseUrl: string;
  private readonly dataBaseUrl: string;
  private session?: SwimSession;
  private readonly fetchFn: typeof fetch;

  constructor(options: SwimClientOptions = {}) {
    this.authBaseUrl = trimTrailingSlash(options.authBaseUrl ?? 'https://top.swim.mlit.go.jp');
    this.dataBaseUrl = trimTrailingSlash(options.dataBaseUrl ?? 'https://web.swim.mlit.go.jp');
    this.session = options.session ? copyValidatedSession(options.session) : undefined;
    this.fetchFn = options.fetch ?? globalThis.fetch;

    if (typeof this.fetchFn !== 'function') {
      throw new Error('A Fetch API implementation is required. Use Node.js 18+ or provide options.fetch.');
    }
  }

  public setSession(session: SwimSession): void {
    this.session = copyValidatedSession(session);
  }

  public clearSession(): void {
    this.session = undefined;
  }

  public getSession(): SwimSession | undefined {
    return this.session ? { ...this.session } : undefined;
  }

  public isAuthenticated(): boolean {
    return Boolean(this.session?.MSMSI && this.session?.MSMAI);
  }

  public getCookieHeader(): string | undefined {
    if (!this.isAuthenticated()) return undefined;
    return `MSMSI=${this.session!.MSMSI}; MSMAI=${this.session!.MSMAI}`;
  }

  public async login(credentials: SwimCredentials): Promise<SwimSession> {
    validateCredentials(credentials);

    const response = await this.fetchFn(`${this.authBaseUrl}/swim/webapi/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error(`Login failed with HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}.`);
    }

    const session = await extractSession(response);
    this.session = session;
    return { ...session };
  }

  /**
   * Requests complete ATIS messages from SWIM API FLV402001.
   *
   * ATIS is terminal operational information for arriving/departing aircraft.
   * Its text may include meteorological observations, but this method does not
   * return standalone METAR reports or a parsed METAR data model.
   */
  public async getAtis(options: GetAtisOptions): Promise<AtisResponse> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required. Call login() or setSession() first.');
    }

    const { locations, dispcnt } = validateAtisOptions(options);
    const query = new URLSearchParams({
      location: locations.join(','),
      dispcnt: String(dispcnt),
    });
    const url = `${this.dataBaseUrl}${ATIS_PATH}?${query.toString()}`;

    const response = await this.fetchFn(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Cookie: this.getCookieHeader()!,
      },
    });

    if (!response.ok) {
      throw new Error(`ATIS request failed with HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}.`);
    }

    const payload = await parseJsonResponse(response);
    assertAtisResponse(payload);

    const businessErrors = payload.error_info.filter(({ error_code }) => error_code !== '0' && error_code !== '1');
    if (businessErrors.length > 0) {
      throw new SwimApiError(formatBusinessError(businessErrors), payload, response.status);
    }

    return payload;
  }
}

function validateCredentials(credentials: SwimCredentials): void {
  if (!credentials || typeof credentials.id !== 'string' || !credentials.id.trim()) {
    throw new TypeError('credentials.id is required.');
  }
  if (typeof credentials.password !== 'string' || !credentials.password) {
    throw new TypeError('credentials.password is required.');
  }
}

function copyValidatedSession(session: SwimSession): SwimSession {
  if (!session || typeof session.MSMSI !== 'string' || !session.MSMSI) {
    throw new TypeError('session.MSMSI is required.');
  }
  if (typeof session.MSMAI !== 'string' || !session.MSMAI) {
    throw new TypeError('session.MSMAI is required.');
  }
  return { ...session };
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

  if (!Number.isInteger(options.dispcnt) || options.dispcnt < 1 || options.dispcnt > 50) {
    throw new RangeError('dispcnt must be an integer from 1 through 50.');
  }

  return { locations, dispcnt: options.dispcnt };
}

async function extractSession(response: Response): Promise<SwimSession> {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const setCookies = typeof headers.getSetCookie === 'function'
    ? headers.getSetCookie()
    : splitSetCookieHeader(headers.get('set-cookie'));

  const values = new Map<string, string>();
  for (const cookie of setCookies) {
    const firstPart = cookie.split(';', 1)[0]?.trim();
    const separator = firstPart?.indexOf('=') ?? -1;
    if (!firstPart || separator < 1) continue;
    values.set(firstPart.slice(0, separator).trim(), firstPart.slice(separator + 1).trim());
  }

  if (!values.has('MSMSI') || !values.has('MSMAI')) {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.toLowerCase().includes('application/json')) {
      const body = await response.json() as Record<string, unknown>;
      if (typeof body.MSMSI === 'string') values.set('MSMSI', body.MSMSI);
      if (typeof body.MSMAI === 'string') values.set('MSMAI', body.MSMAI);
    }
  }

  return copyValidatedSession({
    MSMSI: values.get('MSMSI') ?? '',
    MSMAI: values.get('MSMAI') ?? '',
  });
}

function splitSetCookieHeader(value: string | null): string[] {
  if (!value) return [];
  return value.split(/,(?=\s*[^;,=\s]+=[^;,]*)/g);
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(`ATIS response Content-Type must be application/json, received ${contentType || 'none'}.`);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error('ATIS response body is not valid JSON.', { cause: error });
  }
}

function assertAtisResponse(value: unknown): asserts value is AtisResponse {
  if (!isRecord(value) || !Array.isArray(value.error_info) || value.error_info.length === 0) {
    throw new TypeError('ATIS response is missing error_info.');
  }

  for (const item of value.error_info) {
    if (!isRecord(item) || typeof item.error_code !== 'string' || typeof item.error_description !== 'string') {
      throw new TypeError('ATIS response contains malformed error_info.');
    }
  }

  if ('data' in value && value.data !== undefined) {
    if (!Array.isArray(value.data)) {
      throw new TypeError('ATIS response data must be an array.');
    }
    for (const item of value.data) {
      if (!isRecord(item) || typeof item.location !== 'string' || !Array.isArray(item.atisinfo)
        || item.atisinfo.some((entry) => typeof entry !== 'string')) {
        throw new TypeError('ATIS response contains malformed location data.');
      }
    }
  }
}

function formatBusinessError(errors: AtisErrorInfo[]): string {
  return `SWIM ATIS API returned business error(s): ${errors
    .map(({ error_code, error_description }) => `${error_code}${error_description ? ` (${error_description})` : ''}`)
    .join(', ')}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}
