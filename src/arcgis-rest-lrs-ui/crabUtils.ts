/**
 * This module is used for parsing CRAB route IDs and extracting data such as County FIPS code and direction.
 */

/**
 * A regular expression that will match a CRAB route ID with groups for
 * 1. County FIPS code
 * 2. Road Number (remaining digits after FIPS code)
 * 3. Direction (i or d)
 */
export const crabRouteIdRe = /^(53\d{3})(\d{5})([a-z])$/;

/**
 * Parts of a CRAB route ID.
 */
export interface IParsedCrabRouteId {
  /** FIPS code for the county. All WA counties' codes start with "53" and are followed with three more digits. */
  countyFipsCode: number;
  /** The remaining digits after the FIPS code that uniquely ID a road. */
  roadNumber: number | string;
  /** Indicates a direction, e.g., "i" for increasing. */
  direction: string;
}

/**
 * Parses a CRAB route ID into its component parts.
 * @param routeId Route ID from the LRS layer
 * @throws TypeError - Thrown if routeId is falsy.
 * @throws Error - Thrown if routeId string is not in the expected format.
 */
export function parseCrabRouteId(routeId: string): IParsedCrabRouteId {
  if (!routeId) {
    throw new TypeError(
      `The routeId cannot be falsy. Must match the following RegExp:\n${crabRouteIdRe}`
    );
  }
  const match = routeId.match(crabRouteIdRe);
  if (!match) {
    throw new Error(
      `Invalid CRAB route ID: ${routeId}. Must match ${crabRouteIdRe}`
    );
  }

  // Parse the FIPS code and Road number into integers (number type).
  const [countyFipsCode, roadNumber] = match.slice(1, 3).map(s => {
    if (s) {
      const int = parseInt(s, 10);
      if (!isNaN(int)) {
        return int;
      }
    }
    return s;
  }) as [number, number];

  const direction = match[3];
  return {
    countyFipsCode,
    roadNumber,
    direction
  };
}
