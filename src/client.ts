import {
  GetWeatherOptions,
  SwimClientOptions,
  SwimCredentials,
  SwimSession,
  WeatherResponse,
} from './types.js';

const ATIS_PATH = '/f2atrq/web/FLV402001';
const LOCATION_PATTERN = /^[A-Z0-9]{4}$/;

export class SwimClient {
  private readonly authBaseUrl: string;
  private readonly dataBaseUrl: string;
  private session?: SwimSession;
  private readonly fetchFn: typeof fetch;

  constructor(options: SwimClientOptions = {}) {
    this.authBaseUrl = trimTrailingSlash(options.authBaseUrl ?? 'https://top.swim.mlit.go.jp');
    this.dataBaseUrl = trimTrailingSlash(options.dataBaseUrl ?? 'https://web.swim.mlit.go.jp');
    this.session = options.session ? copyValidatedSession(options.session) : undefined;
    this.fetchFn = options.fetch ?? fetch;
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
      throw new Error(`Login failed with status ${response.status}: ${response.statusText}`);
    }

    const session = await extractSession(response);
    this.session = session;
    return { ...session };
  }

  /**
   * Returns the JSON value produced by the SWIM API without reshaping,
   * renaming, filtering, or otherwise transforming it.
   */
  public async getWeather(options: GetWeatherOptions): Promise<WeatherResponse> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required. Call login() or setSession() first.');
    }

    const { locations, dispcnt } = validateWeatherOptions(options);
    const query = new URLSearchParams({
      location: locations.join(','),
      dispcnt: String(dispcnt),
    });

    const response = await this.fetchFn(`${this.dataBaseUrl}${ATIS_PATH}?${query.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Cookie: this.getCookieHeader()!,
      },
    });

    if (!response.ok) {
      throw new Error(
        `ATIS request failed with HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}.`,
      );
    }

    return response.json();
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

function validateWeatherOptions(options: GetWeatherOptions): { locations: string[]; dispcnt: number } {
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

  const dispcnt = options.dispcnt ?? 5;
  if (!Number.isInteger(dispcnt) || dispcnt < 1 || dispcnt > 50) {
    throw new RangeError('dispcnt must be an integer from 1 through 50.');
  }

  return { locations, dispcnt };
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

  const MSMSI = values.get('MSMSI');
  const MSMAI = values.get('MSMAI');
  if (!MSMSI || !MSMAI) {
    throw new Error('Login response did not return expected MSMSI and MSMAI session cookies.');
  }

  return { MSMSI, MSMAI };
}

function splitSetCookieHeader(value: string | null): string[] {
  return value ? value.split(/,(?=[^;]*=)/) : [];
}

function copyValidatedSession(session: SwimSession): SwimSession {
  if (!session || typeof session.MSMSI !== 'string' || !session.MSMSI) {
    throw new TypeError('session.MSMSI is required.');
  }
  if (typeof session.MSMAI !== 'string' || !session.MSMAI) {
    throw new TypeError('session.MSMAI is required.');
  }
  return { MSMSI: session.MSMSI, MSMAI: session.MSMAI };
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}
