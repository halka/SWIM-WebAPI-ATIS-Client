export interface SwimCredentials {
  id: string;
  password: string;
}

export interface SwimSession {
  MSMSI: string;
  MSMAI: string;
}

export interface GetMetarOptions {
  /**
   * List of ICAO airport codes (e.g. ['RJCC', 'RJTT'] or 'RJCC,RJTT').
   * Individual codes will be comma-separated and URL-encoded.
   */
  location: string | string[];

  /**
   * Number of METAR records to return per location.
   * Defaults to 5.
   */
  dispcnt?: number;
}

export interface SwimClientOptions {
  /**
   * Base URL for the authentication service.
   * Defaults to 'https://top.swim.mlit.go.jp'
   */
  authBaseUrl?: string;

  /**
   * Base URL for the flight/weather data service.
   * Defaults to 'https://web.swim.mlit.go.jp'
   */
  dataBaseUrl?: string;

  /**
   * Initial session cookies if already authenticated.
   */
  session?: SwimSession;

  /**
   * Optional custom fetch function (e.g. for mocking or proxying).
   */
  fetch?: typeof fetch;
}

export interface MetarResponse {
  /**
   * Since the exact response schema is not defined in the OpenAPI spec,
   * we define a flexible structure to support dynamic fields.
   */
  [key: string]: any;
}
