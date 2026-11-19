/**
 * Plain-English hints for N-central errors whose raw text doesn't tell the
 * user what to do.
 */

const UI_SESSION_HINT =
  "Your N-central API user's password has most likely expired (N-central expires " +
  'passwords every 90 days by default, including for API-only users), or MFA is ' +
  'enabled on that user. To fix it: in N-central, reset the password on the user ' +
  'the JWT was created for (optionally set it to never expire and make sure MFA is ' +
  'off), generate a new JWT for that user, then reconnect N-central in Conduit with ' +
  'the new JWT.';

/**
 * Returns the error message with a hint appended when the error is the DMS
 * "CustomAxisFault: 4000 ... Unable to validate UI session" fault (both parts
 * must be present). Other
 * messages are returned unchanged.
 */
export function withErrorHint(message: string): string {
  if (/CustomAxisFault:\s*4000\b/.test(message) && /Unable to validate UI session/i.test(message)) {
    return `${message}\n\nHint: ${UI_SESSION_HINT}`;
  }
  return message;
}
