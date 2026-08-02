import {
  AtisErrorInfo,
  AtisResponse,
  GetAtisOptions,
  SwimClientOptions,
  SwimCredentials,
  SwimSession,
  GetWeatherOptions,
  SwimClientOptions,
  WeatherResponse,
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
  private authBaseUrl: string;
  private dataBaseUrl: string;
  private weatherServiceCode?: string;
  private session?: SwimSession;
  private readonly fetchFn: typeof fetch;

  constructor(options: SwimClientOptions = {}) {
    this.authBaseUrl = options.authBaseUrl?.replace(/\/$/, '') ?? 'https://top.swim.mlit.go.jp';
    this.dataBaseUrl = options.dataBaseUrl?.replace(/\/$/, '') ?? 'https://web.swim.mlit.go.jp';
    this.weatherServiceCode = options.weatherServiceCode ?? getEnvironmentVariable('SWIM_WEATHER_SERVICE_CODE');
    this.session = options.session;
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
    const url = `${this.authBaseUrl}/swim/webapi/login`;

    const response = await this.fetchFn(url, {
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

    let setCookies: string[] = [];
    if (typeof response.headers.getSetCookie === 'function') {
      setCookies = response.headers.getSetCookie();
    } else {
      const rawCookie = response.headers.get('set-cookie');
      if (rawCookie) {
        setCookies = rawCookie.split(/,(?=[^;]*=)/);
      }
    }

    let msmsi: string | undefined;
    let msmai: string | undefined;

    for (const cookie of setCookies) {
      const mainPart = cookie.split(';')[0].trim();
      const eqIdx = mainPart.indexOf('=');
      if (eqIdx !== -1) {
        const name = mainPart.substring(0, eqIdx).trim();
        const value = mainPart.substring(eqIdx + 1).trim();
        if (name === 'MSMSI') {
          msmsi = value;
        } else if (name === 'MSMAI') {
          msmai = value;
        }
      }
    }

    if (!msmsi || !msmai) {
      try {
        const body = await response.json() as any;
        if (body && typeof body === 'object') {
          if (body.MSMSI) msmsi = body.MSMSI;
          if (body.MSMAI) msmai = body.MSMAI;
        }
      } catch {
        // Ignore JSON parse errors if response doesn't have JSON body
      }
    }

    const session = await extractSession(response);
    this.session = session;
    return { ...session };
  }

  /**
   * Retrieve weather observation data for specified airport locations.
   */
  public async getWeather(options: GetWeatherOptions): Promise<WeatherResponse> {
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

    if (!this.weatherServiceCode) {
      throw new Error('SWIM_WEATHER_SERVICE_CODE is required to call the weather Web API.');
    }

    const url = `${this.dataBaseUrl}/${encodeURIComponent(this.weatherServiceCode)}/web/FLV402001?${queryParams.toString()}`;

function validateCredentials(credentials: SwimCredentials): void {
  if (!credentials || typeof credentials.id !== 'string' || !credentials.id.trim()) {
    throw new TypeError('credentials.id is required.');
  }
  if (typeof credentials.password !== 'string' || !credentials.password) {
    throw new TypeError('credentials.password is required.');
  }
}

    const cookieHeader = this.getCookieHeader();
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
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

    if (!response.ok) {
      throw new Error(`getWeather failed with status ${response.status}: ${response.statusText}`);
    }
  }

    const data = await response.json();
    return data as WeatherResponse;
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
