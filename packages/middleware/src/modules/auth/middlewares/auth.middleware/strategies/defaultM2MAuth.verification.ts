/* eslint-disable no-await-in-loop */
import * as jose from 'jose';
import { AuthStrategy } from '.';
import { LOGGER } from '../../../../../../config/logging';

const TRUSTED_JWT_SECRET = process.env.TRUSTED_JWT_SECRET || process.env.PGRST_JWT_SECRET;
const INTERNAL_TRUSTED_SECRET = process.env.INTERNAL_TRUSTED_SECRET || process.env.SMYTHOS_JWT_SECRET;

export default class DefaultM2MAuth implements AuthStrategy {
  name = 'defaultM2MAuth';

  async verifyToken(token: string) {
    if (!token) {
      LOGGER.error(new Error('M2M auth failed: No token found in request header'));
      return { error: 'Access token is required', success: false };
    }

    // Accept internal trusted secret (for app -> middleware intra-container calls)
    if (INTERNAL_TRUSTED_SECRET && token === INTERNAL_TRUSTED_SECRET) {
      return { error: undefined, data: { isInternal: true }, success: true };
    }

    // Accept JWT verified with PGRST_JWT_SECRET
    if (TRUSTED_JWT_SECRET) {
      try {
        const secret = new TextEncoder().encode(TRUSTED_JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secret);
        return { error: undefined, data: { decoded: payload }, success: true };
      } catch {
        // Fall through
      }
    }

    LOGGER.error(new Error('M2M auth failed: token is not a valid internal secret or JWT'));
    return { error: 'Access token is invalid', success: false };
  }
}
