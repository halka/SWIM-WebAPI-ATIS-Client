export interface SwimCredentials {
  id: string;
  password: string;
}

export interface SwimSession {
  MSMSI: string;
  MSMAI: string;
}

export interface GetWeatherOptions {
  /** ICAO aerodrome code or codes. */
  location: string | string[];

  /** Number of records to request. */
  dispcnt?: number;
}

export interface SwimClientOptions {
  /** Authentication origin. Defaults to https://top.swim.mlit.go.jp. */
  authBaseUrl?: string;

  /** ATIS service origin. Defaults to https://web.swim.mlit.go.jp. */
  dataBaseUrl?: string;

  /** Initial authenticated session. */
  session?: SwimSession;

  /** Custom Fetch API implementation. */
  fetch?: typeof fetch;
}

/**
 * The unmodified JSON value returned by the SWIM API.
 */
export type WeatherResponse = unknown;
