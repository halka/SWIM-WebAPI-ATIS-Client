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
   * METAR Web API service code disclosed by SWIM after approval.
   * If omitted, reads SWIM_METAR_SERVICE_CODE from the environment.
   */
  metarServiceCode?: string;

  /**
   * Initial session cookies if already authenticated.
   */
  session?: SwimSession;

  /**
   * Optional custom fetch function (e.g. for mocking or proxying).
   */
  fetch?: typeof fetch;
}

export interface MetarErrorInfo {
  error_code: string;
  error_description: string;
}

export interface MetarLocationData {
  location: string;
  atisInfo: string[];
}

/**
 * SWIM METAR response containing error metadata and ATIS/METAR text grouped by airport.
 */
export interface MetarResponse {
  error_info: MetarErrorInfo[];
  data: MetarLocationData[];
}
