import { Response } from 'express';
import ApiError from '../../../utils/apiError';

export const authExpressHelpers = {
  getUserId: (res: Response) => {
    const userId = res.locals.user.id;
    if (!userId) throw new ApiError(500, 'Identifiant utilisateur introuvable');
    return userId;
  },

  getUser: (res: Response) => {
    const user = res.locals.user;
    if (!user) throw new ApiError(500, 'Utilisateur introuvable');
    return user;
  },

  getAuthUser: (res: Response) => {
    const user = res.locals.logtoUser;
    if (!user) throw new ApiError(500, 'Utilisateur authentifie introuvable');
    return user;
  },

  getUserEmail: (res: Response): string => {
    const email = res.locals.user.email;
    if (!email) throw new ApiError(500, 'Adresse e-mail introuvable');
    return email;
  },

  getTeamId: (res: Response) => {
    const teamId = res.locals.targetTeamId || res.locals.user.teamId; // fallback to user's team id
    if (!teamId) throw new ApiError(500, `Identifiant d'equipe introuvable`);
    return teamId;
  },

  getParentTeamId: (res: Response) => {
    const teamId = res.locals.user.teamId;
    if (!teamId) throw new ApiError(500, `Identifiant d'equipe introuvable`);
    return teamId;
  },
};
