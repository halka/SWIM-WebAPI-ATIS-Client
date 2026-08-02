export interface SwimCredentials {
  id: string;
  password: string;
}

export interface SwimSession {
  MSMSI: string;
  MSMAI: string;
}

export interface GetAtisOptions {
  /**
   * ICAO airport code or codes. Multiple locations are sent as a comma-separated value.
   */
  location: string | string[];

  /**
   * Number of ATIS entries returned per airport. The official API requires 1 through 50.
   */
  dispcnt: number;
}

/** @deprecated Use GetAtisOptions. Retained for source compatibility. */
export type GetMetarOptions = GetAtisOptions;

export interface SwimClientOptions {
  /** Defaults to https://top.swim.mlit.go.jp. */
  authBaseUrl?: string;

  /** Defaults to https://web.swim.mlit.go.jp. */
  dataBaseUrl?: string;

  /**
   * Path segment preceding /web/FLV402001. For the public v1.0.1 specification,
   * this is f2atrq. A different value can be supplied for approved environments.
   */
  atisServiceCode?: string;

  /** @deprecated Use atisServiceCode. */
  metarServiceCode?: string;

  /** Initial session cookies if already authenticated. */
  session?: SwimSession;

  /** Optional custom fetch implementation for testing or proxying. */
  fetch?: typeof fetch;
}

export type AtisErrorCode = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '99';

export interface AtisErrorInfo {
  error_code: AtisErrorCode | string;
  error_description: string;
}

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

/** @deprecated Use AtisErrorInfo. */
export type MetarErrorInfo = AtisErrorInfo;
/** @deprecated Use AtisLocationData. */
export type MetarLocationData = AtisLocationData;
/** @deprecated Use AtisResponse. */
export type MetarResponse = AtisResponse;

export interface SwimApiErrorOptions {
  response: AtisResponse;
  status: number;
}
