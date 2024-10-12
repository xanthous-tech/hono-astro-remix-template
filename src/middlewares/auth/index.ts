import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';

import { auth, getSessionCookieFromSession } from '@/lib/auth';

import { githubAuthRouter } from './github';

export * from './bull-board';

export const authMiddleware = createMiddleware(async (c, next) => {
  const cookies = c.req.header('Cookie') ?? '';
  const sessionId = auth.readSessionCookie(cookies);

  if (!sessionId) {
    c.set('user', null);
    c.set('session', null);
    return next();
  }

  const { session, user } = await auth.validateSession(sessionId);
  const sessionCookie = getSessionCookieFromSession(session);

  if (sessionCookie && session?.fresh) {
    c.header('Set-Cookie', sessionCookie.serialize(), { append: true });
  }

  if (!session) {
    c.header('Set-Cookie', auth.createBlankSessionCookie().serialize(), {
      append: true,
    });
  }

  c.set('user', user);
  c.set('session', session);

  return next();
});

export const authCheckMiddleware = createMiddleware(async (c, next) => {
  if (!c.var.session || !c.var.user) {
    return c.text('Unauthorized', 401);
  }

  return next();
});

export const authRouter = new Hono();

authRouter.route('/github', githubAuthRouter);