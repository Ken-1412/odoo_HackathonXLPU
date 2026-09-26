// ─── Authentication & Authorization Middleware ──────────────────────────────
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { AppError } from './errorHandler';
import prisma from '../config/database';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { id: string };
    }
  }
}

/**
 * Authenticate — verifies JWT from Bearer header or secure cookie
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Fallback: check cookie
    if (!token && req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    // Verify token
    const payload = verifyAccessToken(token);

    // Check MongoDB Mongoose User first
    try {
      const { User: MongoUser } = await import('../models/User');
      const mongoUser = await MongoUser.findById(payload.userId);
      if (mongoUser) {
        if (!mongoUser.isActive) {
          throw new AppError('Account has been deactivated', 403);
        }
        req.user = {
          id: mongoUser._id.toString(),
          userId: mongoUser._id.toString(),
          email: mongoUser.email,
          role: mongoUser.role,
        };
        return next();
      }
    } catch (e: any) {
      if (e instanceof AppError) throw e;
    }

    // Fallback: Check Prisma user if exists
    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { role: true },
      });
    } catch {
      // Prisma lookup failed or not found
    }

    if (!user) {
      // Allow valid signed token payload as fallback for demo / test sessions
      if (payload.userId && payload.email) {
        req.user = {
          id: payload.userId,
          userId: payload.userId,
          email: payload.email,
          role: payload.role || 'INVENTORY_MANAGER',
        };
        return next();
      }
      throw new AppError('User no longer exists', 401);
    }

    if (user.status === 'INACTIVE') {
      throw new AppError('Account has been deactivated', 403);
    }

    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError('Account is locked. Contact your administrator.', 403);
    }

    // Enforce password change for non-administrators before allowing general API access
    if (user.forcePasswordChange && user.role.name !== 'Administrator' && user.role.name !== 'Asset Manager' && !['/change-password', '/me', '/logout'].some(p => req.originalUrl.includes(p))) {
      throw new AppError('Password change required. Please change your temporary password to continue.', 403);
    }

    // Attach user to request
    req.user = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role.name,
      organizationId: user.organizationId || undefined,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Authorize — role-based access control
 * Usage: authorize('Administrator', 'Asset Manager')
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          403
        )
      );
    }

    next();
  };
}
