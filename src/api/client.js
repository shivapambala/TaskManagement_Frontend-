import { storage } from '../utils/storage';

const BASE = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'tf.token';

let unauthorizedHandler = () => {};

export const tokenStore = {
  get: () => storage.get(TOKEN_KEY),
  set: (t) => storage.set(TOKEN_KEY, t),
  clear: () => storage.remove(TOKEN_KEY),
};

export function onUnauthorized(fn) {
  unauthorizedHandler = fn;
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function friendlyMessage(status, data) {
  const fromBody = typeof data === 'string' ? data : data?.message || data?.error;
  if (status === 0) return 'Cannot reach the server. Check that the backend is running on port 8989.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'We could not find what you were looking for.';
  if (status >= 500) {
    return fromBody && fromBody !== 'Internal Server Error'
      ? fromBody
      : 'The server hit a problem handling that request.';
  }
  return fromBody || `Request failed (${status}).`;
}

async function parse(res) {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function request(path, { method = 'GET', body, params, form, auth = true, signal } = {}) {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      if (Array.isArray(v) || v instanceof Set) [...v].forEach((item) => url.searchParams.append(k, item));
      else url.searchParams.set(k, v);
    });
  }

  const headers = {};
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = form; // browser sets multipart boundary
  } else if (body !== undefined) {
    if (typeof body === 'string') {
      headers['Content-Type'] = 'text/plain;charset=UTF-8';
      payload = body;
    } else {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
  }

  let res;
  try {
    res = await fetch(url, { method, headers, body: payload, signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(friendlyMessage(0), 0);
  }

  const data = await parse(res);
  if (!res.ok) {
    if (auth && token && (res.status === 401 || res.status === 403)) {
      unauthorizedHandler(res.status);
    }
    throw new ApiError(friendlyMessage(res.status, data), res.status, data);
  }
  return data;
}
