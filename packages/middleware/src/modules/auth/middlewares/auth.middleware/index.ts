/* eslint-disable no-else-return */
/* eslint-disable consistent-return */
import { NextFunction } from 'express';
import httpStatus from 'http-status';
import { LOGGER } from '../../../../../config/logging';
import ApiError from '../../../../utils/apiError';
import { teamService } from '../../../team/services';
import tokenVerStrategies from './strategies';

const INTERNAL_TRUSTED_SECRET = process.env.INTERNAL_TRUSTED_SECRET || process.env.SMYTHOS_JWT_SECRET;

function isInternalToken(token: string, req: any): boolean {
  if (INTERNAL_TRUSTED_SECRET && token === INTERNAL_TRUSTED_SECRET) return true;
  const internalHeader = req.headers['x-internal-secret'];
  if (INTERNAL_TRUSTED_SECRET && internalHeader === INTERNAL_TRUSTED_SECRET) return true;
  return false;
}

const authMiddlewareFactory = ({ requireTeam = true, allowM2M = false, limitToM2M = false }) => {
  return async (req: any, res: any, next: NextFunction) => {
    try {
      const token: string = req.headers.authorization?.split(' ')[1] || req.query.token;

      if (!token) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, `Un jeton d'acces est requis`));
      }

      const isM2M = isInternalToken(token, req);

      if (isM2M) {
        if (!allowM2M) throw new ApiError(httpStatus.FORBIDDEN, `L'acces M2M n'est pas active`);

        const { success } = await tokenVerStrategies.defaultM2MAuth.verifyToken(token);

        if (!success) {
          return next(new ApiError(httpStatus.UNAUTHORIZED, `Le jeton d'acces est invalide ou expire`));
        }
        res.locals.isM2M = true;

        return next();
      } else {
        // JWT auth (from Authentik/ZappImmo)
        if (limitToM2M) throw new ApiError(httpStatus.FORBIDDEN, `L'authentification utilisateur n'est pas activee pour cette requete`);

        const { data, success } = await tokenVerStrategies.defaultUIAuth.verifyToken(token);

        if (!success) {
          return next(new ApiError(httpStatus.UNAUTHORIZED, `Le jeton d'acces est invalide ou expire`));
        }

        res.locals.logtoUser = data!.logtoUser;
        res.locals.user = data!.user;
        res.locals.userId = data!.userId;

        const teamIdHeader = req.headers['x-smyth-team-id'];
        if (teamIdHeader) {
          const hasTeamAccess = await teamService.isUserPartOfTeam(data!.userId, teamIdHeader);

          if (!hasTeamAccess) {
            throw new ApiError(httpStatus.FORBIDDEN, `Vous n'avez pas acces a cette equipe`);
          }

          res.locals.targetTeamId = teamIdHeader;
        }

        if (requireTeam && !data!.user?.teamId) {
          throw new ApiError(httpStatus.BAD_REQUEST, `Veuillez creer une equipe et reessayer`);
        }

        runLocalsFieldsSanityChecks(res);

        return next();
      }
    } catch (error: any) {
      return next(new ApiError(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR, error.message));
    }
  };
};

const runLocalsFieldsSanityChecks = (res: any) => {
  if (!res.locals.logtoUser || !res.locals.user || !res.locals.userId) {
    LOGGER.error(new Error(`User auth middleware failed to set required fields in res.locals`));
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Une erreur est survenue`);
  }
};

const userAuthMiddleware = authMiddlewareFactory({
  allowM2M: false,
  requireTeam: true,
  limitToM2M: false,
});

export { authMiddlewareFactory, userAuthMiddleware };
