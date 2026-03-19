/* eslint-disable no-await-in-loop */
import crypto from 'crypto';
import * as jose from 'jose';
import { AuthStrategy } from '.';
import { LOGGER } from '../../../../../../config/logging';

const TRUSTED_JWT_SECRET = process.env.TRUSTED_JWT_SECRET;
// SEC: No fallback to SMYTHOS_JWT_SECRET — must be explicitly set
const INTERNAL_TRUSTED_SECRET = process.env.INTERNAL_TRUSTED_SECRET;

export default class DefaultM2MAuth implements AuthStrategy {
  name = 'defaultM2MAuth';

  async verifyToken(token: string) {
    if (!token) {
      LOGGER.error(new Error('M2M auth failed: No token found in request header'));
      return { error: `Un jeton d'acces est requis`, success: false };
    }

    // SEC: Timing-safe comparison for internal secret
    if (INTERNAL_TRUSTED_SECRET) {
      const tokenBuf = Buffer.from(token, 'utf8');
      const secretBuf = Buffer.from(INTERNAL_TRUSTED_SECRET, 'utf8');
      if (tokenBuf.length === secretBuf.length && crypto.timingSafeEqual(tokenBuf, secretBuf)) {
        return { error: undefined, data: { isInternal: true }, success: true };
      }
    }

    // Accept JWT verified with TRUSTED_JWT_SECRET (HS256 only)
    if (TRUSTED_JWT_SECRET) {
      try {
        const secret = new TextEncoder().encode(TRUSTED_JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secret, { algorithms: ['HS256'] });
        return { error: undefined, data: { decoded: payload }, success: true };
      } catch {
        // Fall through
      }
    }

    LOGGER.error(new Error('M2M auth failed: token is not a valid internal secret or JWT'));
    return { error: `Le jeton d'acces est invalide`, success: false };
  }
}
