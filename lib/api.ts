import { auth } from './firebase';
import type { OnboardingPrompt, MessageMeta } from './types';

/* ------------------------------------------------------------------ */
/* Config                                                             */
/* ------------------------------------------------------------------ */

const PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '';
const REGION = 'us-central1';
/**
 * Stable Firebase Functions URL. Works for both v1 and v2 (the v2 ones get
 * routed to the underlying Cloud Run service automatically).
 */
const FUNCTIONS_BASE_URL = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;

/* ------------------------------------------------------------------ */
/* Errors                                                             */
/* ------------------------------------------------------------------ */

export class NotSignedInError extends Error {
  constructor() {
    super('You need to be signed in.');
    this.name = 'NotSignedInError';
  }
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  get isAuthError() {
    return this.status === 401 || this.code === 'unauthenticated';
  }
}

/* ------------------------------------------------------------------ */
/* Core call helper                                                   */
/* ------------------------------------------------------------------ */

interface CallOptions {
  /** Total attempts (default 3). Set 1 to disable retry. */
  maxAttempts?: number;
  /** Backoff base in ms (default 600). */
  baseDelayMs?: number;
  /** Request timeout in ms (default 90s). */
  timeoutMs?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getFreshIdToken(): Promise<{ uid: string; idToken: string }> {
  const user = auth.currentUser;
  if (!user) throw new NotSignedInError();
  // Force refresh so server never sees a stale token.
  const idToken = await user.getIdToken(true);
  if (!idToken) throw new NotSignedInError();
  return { uid: user.uid, idToken };
}

function isRetryable(e: unknown): boolean {
  if (e instanceof ApiError) {
    // Server-side transient codes.
    return e.status >= 500 && e.status < 600;
  }
  // Network / fetch failures.
  if (e instanceof Error) {
    const msg = e.message.toLowerCase();
    return (
      msg.includes('network') ||
      msg.includes('failed to fetch') ||
      msg.includes('timeout') ||
      msg.includes('aborted')
    );
  }
  return false;
}

async function postOnce<T>(
  fnName: string,
  payload: Record<string, unknown>,
  timeoutMs: number
): Promise<T> {
  const { uid, idToken } = await getFreshIdToken();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${FUNCTIONS_BASE_URL}/${fnName}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...payload, userId: uid }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // body wasn't JSON — fall through to status-only error
  }

  if (!res.ok) {
    const errObj = (json as { error?: { code?: string; message?: string } } | null)
      ?.error;
    throw new ApiError(
      res.status,
      errObj?.code || 'unknown',
      errObj?.message || `Request failed (HTTP ${res.status}).`
    );
  }

  return ((json as { data?: T } | null)?.data ?? (json as T)) as T;
}

async function call<T>(
  fnName: string,
  payload: Record<string, unknown>,
  options: CallOptions = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 600;
  const timeoutMs = options.timeoutMs ?? 90_000;

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await postOnce<T>(fnName, payload, timeoutMs);
    } catch (e) {
      lastError = e;
      if (!isRetryable(e) || attempt === maxAttempts - 1) {
        throw e;
      }
      await sleep(baseDelayMs * Math.pow(2, attempt));
    }
  }
  throw lastError;
}

/* ------------------------------------------------------------------ */
/* Typed wrappers                                                     */
/* ------------------------------------------------------------------ */

interface GenerateOnboardingResult {
  prompts: OnboardingPrompt[];
}

interface ProcessMessageResult {
  response: string;
  meta: MessageMeta;
}

interface EndSessionResult {
  cardTitle: string;
  cardArtUrl: string;
  cardMetallicColor: string;
  pdfUrl: string;
}

export async function generateOnboarding(args: { isFirstSession: boolean }) {
  const data = await call<GenerateOnboardingResult>(
    'generateOnboarding',
    { isFirstSession: args.isFirstSession },
    { timeoutMs: 30_000 }
  );
  return { data };
}

export async function processMessage(args: {
  sessionId: string;
  userMessage?: string;
  isSessionStart?: boolean;
  isResume?: boolean;
}) {
  const data = await call<ProcessMessageResult>(
    'processMessage',
    {
      sessionId: args.sessionId,
      userMessage: args.userMessage,
      isSessionStart: args.isSessionStart ?? false,
      isResume: args.isResume ?? false,
    },
    { timeoutMs: 90_000 }
  );
  return { data };
}

export async function endSession(args: { sessionId: string }) {
  const data = await call<EndSessionResult>(
    'endSession',
    { sessionId: args.sessionId },
    // endSession is heavy (PDF + card generation). Longer timeout, fewer attempts.
    { maxAttempts: 2, baseDelayMs: 1500, timeoutMs: 240_000 }
  );
  return { data };
}
