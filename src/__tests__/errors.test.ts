import { describe, it, expect } from 'vitest';
import { withErrorHint } from '../utils/errors.js';

const DMS_4000 =
  'GET /api/devices failed with HTTP 500: [ID=x] INTERNAL SERVER ERROR: UnexpectedDmsResponseException: ' +
  'Unexpected response from DMS: Device List - The response indicates a error content. ' +
  'error=com.nable.dmsframework.CustomAxisFault: 4000 [tid: y] Unable to validate UI session: null.';

describe('withErrorHint', () => {
  it('appends the expired-password hint to DMS 4000 UI session faults', () => {
    const out = withErrorHint(DMS_4000);
    expect(out.startsWith(DMS_4000)).toBe(true);
    expect(out).toContain('Hint:');
    expect(out).toMatch(/password has most likely expired/);
    expect(out).toMatch(/new JWT/);
  });

  it('does not match partial signatures', () => {
    const otherCode = 'CustomAxisFault: 4001 [tid: y] Unable to validate UI session: null.';
    const noSession = 'CustomAxisFault: 4000 [tid: y] SessionID not found or has expired.';
    expect(withErrorHint(otherCode)).toBe(otherCode);
    expect(withErrorHint(noSession)).toBe(noSession);
  });

  it('leaves other errors unchanged', () => {
    const msg =
      'GET /api/devices failed with HTTP 401: UNAUTHORIZED: UserPermissionException: User does not have permissions to view the devices.';
    expect(withErrorHint(msg)).toBe(msg);
    expect(withErrorHint('Authentication request failed: fetch failed')).toBe(
      'Authentication request failed: fetch failed'
    );
  });
});
