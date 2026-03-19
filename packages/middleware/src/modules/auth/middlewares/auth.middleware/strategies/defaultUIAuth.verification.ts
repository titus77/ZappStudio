/* eslint-disable no-else-return */
import * as jose from 'jose';
import { AuthStrategy } from '.';
import { LOGGER } from '../../../../../../config/logging';
import { userService } from '../../../../user/services';

const TRUSTED_JWT_SECRET = process.env.TRUSTED_JWT_SECRET;

interface UserTokenData {
  logtoUser?: any;
  user?: {
    id: any;
    email: any;
    teamId: any;
  };
  userId?: any;
}

export default class DefaultUIAuth implements AuthStrategy {
  name = 'defaultUIAuth';

  async verifyToken(token: string) {
    const data: UserTokenData = {};

    if (!token) {
      return { error: `Un jeton d'acces est requis`, data: null, success: false };
    }

    // Verify JWT with TRUSTED_JWT_SECRET (ZappImmo trusted secret)
    let decoded: jose.JWTPayload;
    try {
      if (!TRUSTED_JWT_SECRET) {
        LOGGER.error(new Error('TRUSTED_JWT_SECRET is not configured'));
        return { error: 'Erreur de configuration serveur : secret JWT manquant', data: null, success: false };
      }
      const secret = new TextEncoder().encode(TRUSTED_JWT_SECRET);
      // SEC: Restrict to HS256 only (prevent algorithm confusion)
      const { payload } = await jose.jwtVerify(token, secret, { algorithms: ['HS256'] });
      decoded = payload;
    } catch (err: any) {
      LOGGER.error(new Error(`JWT verification failed: ${err.message}`));
      return { error: `Le jeton d'acces est invalide ou expire`, data: null, success: false };
    }

    const userAuth = {
      sub: (decoded.sub || decoded.user_id) as string,
      name: (decoded.name || (decoded.email as string)?.split('@')[0] || 'User') as string,
      email: decoded.email as string,
      email_verified: true,
      primaryEmail: decoded.email as string,
      avatar: (decoded.picture || decoded.avatar) as string | undefined,
      tenant_id: decoded.tenant_id as string | undefined,
    };

    data.logtoUser = userAuth;

    // Find or create user in ZappStudio DB (tenant-aware)
    const user = await userService.findOrCreateUserWithTenant({
      email: userAuth.primaryEmail,
      name: userAuth.name,
      avatar: userAuth.avatar,
      tenantId: userAuth.tenant_id,
    });

    if (!user.teamId) {
      LOGGER.info(`User ${userAuth.primaryEmail} is logging without a team`);
      return { error: `L'utilisateur n'appartient a aucune equipe`, data: null, success: false };
    }

    data.user = {
      id: user.id,
      email: user.email,
      teamId: user.teamId,
    };
    data.userId = user.id;

    return { data, success: true };
  }
}
