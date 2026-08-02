export interface SwimCredentials {
  id: string;
  password: string;
}

export interface SwimSession {
  MSMSI: string;
  MSMAI: string;
}

export interface GetWeatherOptions {
  /**
   * List of ICAO airport codes (e.g. ['RJCC', 'RJTT'] or 'RJCC,RJTT').
   * Individual codes will be comma-separated and URL-encoded.
   */
  location: string | string[];

  /**
   * Number of weather records to return per location.
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
   * Weather Web API service code disclosed by SWIM after approval.
   * If omitted, reads SWIM_WEATHER_SERVICE_CODE from the environment.
   */
  weatherServiceCode?: string;

  /**
   * Initial session cookies if already authenticated.
   */
  session?: SwimSession;

  /**
   * Optional custom fetch function (e.g. for mocking or proxying).
   */
  fetch?: typeof fetch;
}

export interface WeatherErrorInfo {
  error_code: string;
  error_description: string;
}

export interface WeatherLocationData {
  location: string;
  atisInfo: string[];
}

/**
 * SWIM weather response containing error metadata and ATIS/METAR text grouped by airport.
 */
export interface WeatherResponse {
  error_info: WeatherErrorInfo[];
  data: WeatherLocationData[];
}
