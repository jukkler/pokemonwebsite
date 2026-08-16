import { describe, expect, it } from 'vitest';
import { getSafeAdminRedirectPath } from '@/lib/auth-redirect';

describe('getSafeAdminRedirectPath', () => {
  it.each([
    [null, '/admin'],
    [undefined, '/admin'],
    ['', '/admin'],
    ['/pokeroute', '/pokeroute'],
    ['/tabelle?filter=team#spieler', '/tabelle?filter=team#spieler'],
  ])('maps %s to %s', (input, expected) => {
    expect(getSafeAdminRedirectPath(input)).toBe(expected);
  });

  it.each([
    'https://example.com',
    '//example.com',
    '/\\example.com',
    '/%5Cexample.com',
    '/%2Fexample.com',
    '/%252Fexample.com',
    '/admin?next=https://example.com',
    '/broken%',
  ])('rejects unsafe redirect %s', (input) => {
    expect(getSafeAdminRedirectPath(input)).toBe('/admin');
  });
});
