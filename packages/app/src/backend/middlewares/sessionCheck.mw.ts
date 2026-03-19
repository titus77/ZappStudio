import express from 'express';

export async function sessionCheck(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  // Session checks are handled by authentikAuth middleware.
  // This middleware is kept for backward compatibility with the middleware chain.
  next();
}
