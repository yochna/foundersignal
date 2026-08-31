import { NextResponse } from 'next/server';
import { AppError, ErrorCode, badRequest, serializeError, toAppError } from '@/lib/errors';
import { MAX_UPLOAD_BYTES } from '@/lib/config';

/**
 * Wraps a route handler so no unhandled rejection ever reaches the client as an
 * HTML error page. Handlers may return a plain object (wrapped as
 * `{ ok: true, ...}`), a NextResponse, or throw an AppError.
 */
export function withApi(handler, options = {}) {
  return async function wrapped(request, context) {
    const started = Date.now();
    try {
      const result = await handler(request, context);
      if (result instanceof NextResponse || result instanceof Response) return result;
      return NextResponse.json(
        { ok: true, ...(result || {}) },
        { status: options.successStatus || 200, headers: noStoreHeaders(options) }
      );
    } catch (error) {
      const appError = toAppError(error);

      // 5xx means we broke; 4xx means the caller did. Only log the former loudly.
      const logLine = `[api] ${request?.method || '?'} ${safePath(request)} -> ${appError.code} (${
        Date.now() - started
      }ms)`;
      if (appError.status >= 500) {
        console.error(logLine, appError.message, appError.cause || '');
      } else {
        console.warn(logLine, appError.message);
      }

      return NextResponse.json(serializeError(appError), {
        status: appError.status,
        headers: {
          ...noStoreHeaders(options),
          ...(appError.code === ErrorCode.QUOTA_EXCEEDED ? { 'Retry-After': '3600' } : {}),
        },
      });
    }
  };
}

function safePath(request) {
  try {
    return new URL(request.url).pathname;
  } catch {
    return 'unknown';
  }
}

function noStoreHeaders(options) {
  return options.cache
    ? { 'Cache-Control': options.cache }
    : { 'Cache-Control': 'no-store, max-age=0' };
}

/** Parse a JSON body defensively. Empty bodies become `{}`. */
export async function readJson(request) {
  let raw;
  try {
    raw = await request.text();
  } catch (error) {
    throw badRequest('Could not read the request body', { cause: error });
  }
  if (!raw || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw badRequest('Request body must be a JSON object');
    }
    return parsed;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw badRequest('Request body is not valid JSON', { cause: error });
  }
}

/** Parse multipart form data, enforcing the upload ceiling. */
export async function readFormData(request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_UPLOAD_BYTES) {
    throw new AppError(ErrorCode.PAYLOAD_TOO_LARGE, 'Upload exceeds the 4 MB limit');
  }
  try {
    return await request.formData();
  } catch (error) {
    throw badRequest('Could not read the uploaded form data', { cause: error });
  }
}

/** Validate a body against a zod schema, surfacing field-level messages. */
export function parseWith(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw badRequest('Some fields are invalid', {
      details: result.error.issues.map((i) => ({
        path: i.path.join('.') || '(root)',
        message: i.message,
      })),
    });
  }
  return result.data;
}

export function searchParams(request) {
  try {
    return new URL(request.url).searchParams;
  } catch {
    return new URLSearchParams();
  }
}

// Re-exported so existing route imports keep working; the implementation lives
// in lib/http.js because it must be importable without next/server.
export { fetchWithTimeout } from '@/lib/http';
