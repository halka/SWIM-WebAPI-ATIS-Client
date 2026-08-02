import {
  SwimCredentials,
  SwimSession,
  GetWeatherOptions,
  SwimClientOptions,
  WeatherResponse,
} from './types.js';

export class SwimClient {
  private authBaseUrl: string;
  private dataBaseUrl: string;
  private weatherServiceCode?: string;
  private session?: SwimSession;
  private fetchFn: typeof fetch;

  constructor(options: SwimClientOptions = {}) {
    this.authBaseUrl = options.authBaseUrl?.replace(/\/$/, '') ?? 'https://top.swim.mlit.go.jp';
    this.dataBaseUrl = options.dataBaseUrl?.replace(/\/$/, '') ?? 'https://web.swim.mlit.go.jp';
    this.weatherServiceCode = options.weatherServiceCode ?? getEnvironmentVariable('SWIM_WEATHER_SERVICE_CODE');
    this.session = options.session;
    this.fetchFn = options.fetch ?? fetch;
  }

  /**
   * Set the session cookies directly.
   */
  public setSession(session: SwimSession): void {
    this.session = session;
  }

  /**
   * Get the current session cookies.
   */
  public getSession(): SwimSession | undefined {
    return this.session;
  }

  /**
   * Check if the client has session cookies.
   */
  public isAuthenticated(): boolean {
    return !!(this.session?.MSMSI && this.session?.MSMAI);
  }

  /**
   * Build the Cookie header string from the current session.
   */
  public getCookieHeader(): string | undefined {
    if (!this.session) return undefined;
    const parts: string[] = [];
    if (this.session.MSMSI) parts.push(`MSMSI=${this.session.MSMSI}`);
    if (this.session.MSMAI) parts.push(`MSMAI=${this.session.MSMAI}`);
    return parts.length > 0 ? parts.join('; ') : undefined;
  }

  /**
   * Authenticate with the SWIM platform using credentials.
   * On success, parses and stores MSMSI and MSMAI session cookies.
   */
  public async login(credentials: SwimCredentials): Promise<SwimSession> {
    const url = `${this.authBaseUrl}/swim/webapi/login`;

    const response = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

    if (!msmsi || !msmai) {
      throw new Error('Login response did not return expected MSMSI and MSMAI session cookies.');
    }

    const session: SwimSession = { MSMSI: msmsi, MSMAI: msmai };
    this.session = session;
    return session;
  }

  /**
   * Retrieve weather observation data for specified airport locations.
   */
  public async getWeather(options: GetWeatherOptions): Promise<WeatherResponse> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required. Call login() or setSession() first.');
    }

    const locations = Array.isArray(options.location)
      ? options.location.join(',')
      : options.location;

    const queryParams = new URLSearchParams();
    queryParams.set('location', locations);
    if (options.dispcnt !== undefined) {
      queryParams.set('dispcnt', options.dispcnt.toString());
    }

    if (!this.weatherServiceCode) {
      throw new Error('SWIM_WEATHER_SERVICE_CODE is required to call the weather Web API.');
    }

    const url = `${this.dataBaseUrl}/${encodeURIComponent(this.weatherServiceCode)}/web/FLV402001?${queryParams.toString()}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const cookieHeader = this.getCookieHeader();
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }

    const response = await this.fetchFn(url, {
      method: 'GET',
      headers,
    });

    if (response.status === 403) {
      throw new Error('SWIM API returned 403 Forbidden. Session may have expired or is invalid.');
    }

    if (!response.ok) {
      throw new Error(`getWeather failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data as WeatherResponse;
  }
}

function getEnvironmentVariable(name: string): string | undefined {
  const processLike = globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
    };
  };

  const value = processLike.process?.env?.[name];
  return value && value.trim() ? value.trim() : undefined;
}
