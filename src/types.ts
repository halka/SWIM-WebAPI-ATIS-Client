export interface SwimCredentials {
  id: string;
  password: string;
}

export interface SwimSession {
  MSMSI: string;
  MSMAI: string;
}

export interface GetAtisOptions {
  /** ICAO aerodrome location indicator(s), for example RJTT or ['RJTT', 'RJCC']. */
  location: string | string[];

  /** Number of ATIS messages returned per aerodrome. Required range: 1 through 50. */
  dispcnt: number;
}

export interface SwimClientOptions {
  /** Authentication origin. Defaults to https://top.swim.mlit.go.jp. */
  authBaseUrl?: string;

  /** ATIS service origin. Defaults to https://web.swim.mlit.go.jp. */
  dataBaseUrl?: string;

  /** Initial SWIM session cookies. */
  session?: SwimSession;

  /** Custom Fetch API implementation, primarily for tests and controlled proxies. */
  fetch?: typeof fetch;
}

export type AtisResultCode = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '99';

export interface AtisErrorInfo {
  error_code: AtisResultCode | string;
  error_description: string;
}

/**
 * One aerodrome's ATIS messages.
 *
 * Each `atisinfo` entry is a complete ATIS message. It may contain an embedded
 * aerodrome meteorological observation, but it is not a standalone METAR object.
 */
export interface AtisLocationData {
  location: string;
  atisinfo: string[];
}

export interface AtisSuccessResponse {
  error_info: AtisErrorInfo[];
  data: AtisLocationData[];
}

export interface AtisErrorResponse {
  error_info: AtisErrorInfo[];
  data?: never;
}

export type AtisResponse = AtisSuccessResponse | AtisErrorResponse;
