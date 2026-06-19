import * as functions from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import type { Request } from 'firebase-functions/v2/https';
import type { Response } from 'express';

/**
 * Application errors that should turn into a specific HTTP status and a
 * client-readable code/message. Anything not caught as an HttpError becomes
 * a generic 500.
 */
export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Context passed to every handler after auth + validation. */
export interface HandlerContext {
  uid: string;
  body: Record<string, unknown>;
}

export type Handler<T> = (ctx: HandlerContext) => Promise<T>;

interface DefineEndpointOptions {
  timeoutSeconds?: number;
  memory?: '256MiB' | '512MiB' | '1GiB' | '2GiB';
  secrets?: string[];
}

async function readBearerToken(req: Request): Promise<string> {
  const raw = req.get('Authorization') || req.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(raw.trim());
  if (!match) {
    throw new HttpError(401, 'unauthenticated', 'Missing or malformed Authorization header.');
  }
  return match[1].trim();
}

async function verifyToken(token: string): Promise<string> {
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'verification failed';
    console.warn('verifyIdToken failed:', msg);
    throw new HttpError(401, 'unauthenticated', 'Invalid or expired sign in. Please sign in again.');
  }
}

/**
 * Wraps an async handler in an HTTP endpoint that:
 *   1. Requires POST
 *   2. Verifies a Firebase ID token from `Authorization: Bearer ...`
 *   3. Confirms the body's `userId` matches the verified uid
 *   4. Returns the handler's result as `{ data: ... }`
 *   5. Returns errors as `{ error: { code, message } }`
 *
 * All branches log enough context to diagnose auth issues in Cloud Logging.
 */
export function defineEndpoint<T>(
  handler: Handler<T>,
  options: DefineEndpointOptions = {}
) {
  return functions.onRequest(
    {
      timeoutSeconds: options.timeoutSeconds ?? 60,
      memory: options.memory,
      secrets: options.secrets,
      cors: true,
    },
    async (req: Request, res: Response) => {
      try {
        if (req.method === 'OPTIONS') {
          res.status(204).send('');
          return;
        }
        if (req.method !== 'POST') {
          throw new HttpError(405, 'method-not-allowed', 'Use POST.');
        }

        const token = await readBearerToken(req);
        const uid = await verifyToken(token);

        const body =
          typeof req.body === 'object' && req.body !== null
            ? (req.body as Record<string, unknown>)
            : {};

        const expectedUserId = typeof body.userId === 'string' ? body.userId : undefined;
        if (expectedUserId && expectedUserId !== uid) {
          console.warn('User mismatch', { uid, expectedUserId });
          throw new HttpError(403, 'permission-denied', 'You can only operate on your own data.');
        }

        const result = await handler({ uid, body });
        res.status(200).json({ data: result });
      } catch (e) {
        if (e instanceof HttpError) {
          res.status(e.status).json({
            error: { code: e.code, message: e.message },
          });
          return;
        }
        console.error('Unhandled endpoint error:', e);
        const message =
          e instanceof Error ? e.message : 'Internal server error.';
        res.status(500).json({ error: { code: 'internal', message } });
      }
    }
  );
}

/**
 * Convenience helpers for handlers that need typed access to body fields.
 */
export function requireString(body: Record<string, unknown>, key: string): string {
  const v = body[key];
  if (typeof v !== 'string' || v.length === 0) {
    throw new HttpError(400, 'invalid-argument', `Missing or invalid '${key}'.`);
  }
  return v;
}

export function optionalString(body: Record<string, unknown>, key: string): string | undefined {
  const v = body[key];
  return typeof v === 'string' ? v : undefined;
}

export function optionalBoolean(body: Record<string, unknown>, key: string): boolean {
  return body[key] === true;
}
