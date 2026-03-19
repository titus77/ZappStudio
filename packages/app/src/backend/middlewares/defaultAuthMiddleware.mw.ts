import { NextFunction, Request, Response } from 'express';

export const defaultAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // prefill all info needed by app in req object
  req.user = {
    id: '1',
    // @ts-ignore
    email: 'admin@zapp.immo',
    role: 'admin',
    accessToken: 'UI_AUTH_TOKEN',
    isAuthenticated: true,
    claims: {
      email: 'admin@zapp.immo',
      id: '1',
      sub: '1',
    },
  };

  next();
};
