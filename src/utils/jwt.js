/** Decode (not verify) a JWT payload so the UI can show the user's email/role/expiry. */
export function decodeToken(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const claims = decodeToken(token);
  if (!claims?.exp) return true;
  return claims.exp * 1000 <= Date.now();
}
