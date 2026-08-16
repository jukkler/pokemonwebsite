const DEFAULT_ADMIN_REDIRECT = '/admin';

/**
 * Accepts same-origin application paths only. The decoded variants are checked
 * as well so encoded protocol-relative URLs cannot bypass the guard.
 */
export function getSafeAdminRedirectPath(
  redirectParam: string | null | undefined,
): string {
  if (!redirectParam) return DEFAULT_ADMIN_REDIRECT;

  const candidate = redirectParam.trim();
  if (!candidate) return DEFAULT_ADMIN_REDIRECT;

  const variants = [candidate];
  let decoded = candidate;

  try {
    for (let index = 0; index < 2; index += 1) {
      const nextDecoded = decodeURIComponent(decoded);
      if (nextDecoded === decoded) break;
      variants.push(nextDecoded);
      decoded = nextDecoded;
    }
  } catch {
    return DEFAULT_ADMIN_REDIRECT;
  }

  const isUnsafe = variants.some((value) => (
    !value.startsWith('/')
    || value.startsWith('//')
    || value.includes('\\')
    || value.includes('://')
  ));

  if (isUnsafe) return DEFAULT_ADMIN_REDIRECT;

  try {
    const appOrigin = 'https://pokemonwebsite.local';
    const url = new URL(candidate, appOrigin);
    if (url.origin !== appOrigin || url.username || url.password) {
      return DEFAULT_ADMIN_REDIRECT;
    }
  } catch {
    return DEFAULT_ADMIN_REDIRECT;
  }

  return candidate;
}
