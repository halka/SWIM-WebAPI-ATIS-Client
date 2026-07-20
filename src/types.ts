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

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

/**
 * SWIM returns METAR data as JSON. The exact response schema is service-defined,
 * so the client exposes the parsed JSON value without narrowing its shape.
 */
export type MetarResponse = JsonValue;
