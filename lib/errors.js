/**
 * Typed application errors. Every API route returns one of these shapes so the
 * client can branch on `code` instead of parsing English strings.
 */

export const ErrorCode = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  BUDGET_EXCEEDED: 'BUDGET_EXCEEDED',
  UPSTREAM_UNAVAILABLE: 'UPSTREAM_UNAVAILABLE',
  UPSTREAM_RATE_LIMITED: 'UPSTREAM_RATE_LIMITED',
  AI_UNAVAILABLE: 'AI_UNAVAILABLE',
  AI_INVALID_RESPONSE: 'AI_INVALID_RESPONSE',
  DB_UNAVAILABLE: 'DB_UNAVAILABLE',
  READ_ONLY: 'READ_ONLY',
  INTERNAL: 'INTERNAL',
};

const STATUS_BY_CODE = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.PAYLOAD_TOO_LARGE]: 413,
  [ErrorCode.QUOTA_EXCEEDED]: 429,
  [ErrorCode.BUDGET_EXCEEDED]: 429,
  [ErrorCode.UPSTREAM_RATE_LIMITED]: 429,
  [ErrorCode.UPSTREAM_UNAVAILABLE]: 502,
  [ErrorCode.AI_UNAVAILABLE]: 503,
  [ErrorCode.AI_INVALID_RESPONSE]: 502,
  [ErrorCode.DB_UNAVAILABLE]: 503,
  [ErrorCode.READ_ONLY]: 503,
  [ErrorCode.INTERNAL]: 500,
};

export class AppError extends Error {
  constructor(code, message, options = {}) {
    super(message || code);
    this.name = 'AppError';
    this.code = code in STATUS_BY_CODE ? code : ErrorCode.INTERNAL;
    this.status = options.status || STATUS_BY_CODE[this.code] || 500;
    // A short, actionable next step shown directly to the user.
    this.hint = options.hint || defaultHint(this.code);
    this.details = options.details;
    this.cause = options.cause;
    // Extra payload merged into the response, e.g. { resetAt, remaining }.
    this.meta = options.meta;
  }
}

function defaultHint(code) {
  switch (code) {
    case ErrorCode.UNAUTHORIZED:
      return 'Sign in to continue.';
    case ErrorCode.FORBIDDEN:
      return 'This action needs an admin account.';
    case ErrorCode.NOT_FOUND:
      return 'It may have been removed by a newer ingestion run.';
    case ErrorCode.PAYLOAD_TOO_LARGE:
      return 'Upload a smaller file, or paste the text instead.';
    case ErrorCode.QUOTA_EXCEEDED:
      return 'Your free daily allowance resets at 00:00 UTC.';
    case ErrorCode.BUDGET_EXCEEDED:
      return 'The shared demo AI budget for today is spent. Heuristic scoring is still available.';
    case ErrorCode.UPSTREAM_RATE_LIMITED:
      return 'The upstream provider is rate limiting us. Try again in a minute.';
    case ErrorCode.AI_UNAVAILABLE:
      return 'Add GEMINI_API_KEY to enable live AI. Heuristic results are shown meanwhile.';
    case ErrorCode.AI_INVALID_RESPONSE:
      return 'The model returned malformed output. Retrying usually fixes it.';
    case ErrorCode.DB_UNAVAILABLE:
      return 'Check your Supabase credentials, or run without them to use the local store.';
    case ErrorCode.READ_ONLY:
      return 'This deployment has no writable storage. Connect Supabase to persist changes.';
    case ErrorCode.BAD_REQUEST:
      return 'Check the submitted fields and try again.';
    default:
      return 'Try again. If it keeps happening, check the server logs.';
  }
}

export const badRequest = (m, o) => new AppError(ErrorCode.BAD_REQUEST, m, o);
export const unauthorized = (m = 'Authentication required', o) => new AppError(ErrorCode.UNAUTHORIZED, m, o);
export const forbidden = (m = 'Not permitted', o) => new AppError(ErrorCode.FORBIDDEN, m, o);
export const notFound = (m = 'Not found', o) => new AppError(ErrorCode.NOT_FOUND, m, o);
export const quotaExceeded = (m, o) => new AppError(ErrorCode.QUOTA_EXCEEDED, m, o);
export const internal = (m = 'Unexpected server error', o) => new AppError(ErrorCode.INTERNAL, m, o);

/** Coerce anything thrown anywhere into an AppError. */
export function toAppError(error) {
  if (error instanceof AppError) return error;

  if (error?.name === 'AbortError' || error?.code === 'ABORT_ERR') {
    return new AppError(ErrorCode.UPSTREAM_UNAVAILABLE, 'The upstream request timed out', {
      cause: error,
    });
  }
  if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED' || error?.code === 'EAI_AGAIN') {
    return new AppError(ErrorCode.UPSTREAM_UNAVAILABLE, 'Network unreachable', { cause: error });
  }
  if (error?.code === 'EROFS' || error?.code === 'EACCES' || error?.code === 'EPERM') {
    return new AppError(ErrorCode.READ_ONLY, 'Storage is not writable', { cause: error });
  }
  if (error?.name === 'ZodError') {
    return new AppError(ErrorCode.BAD_REQUEST, 'Invalid input', {
      details: error.issues?.map((i) => ({ path: i.path?.join('.'), message: i.message })),
      cause: error,
    });
  }
  if (error instanceof SyntaxError) {
    return new AppError(ErrorCode.BAD_REQUEST, 'Malformed JSON body', { cause: error });
  }

  return new AppError(ErrorCode.INTERNAL, error?.message || 'Unexpected server error', {
    cause: error,
  });
}

export function serializeError(error) {
  const appError = toAppError(error);
  return {
    ok: false,
    error: {
      code: appError.code,
      message: appError.message,
      hint: appError.hint,
      ...(appError.details ? { details: appError.details } : {}),
      ...(appError.meta ? { meta: appError.meta } : {}),
    },
  };
}
