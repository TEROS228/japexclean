import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-fallback-secret-change-in-production';

export interface JWTPayload {
  userId: string;
  email: string;
  isAdmin?: boolean;
}

export const generateToken = (payload: JWTPayload): string => {
  console.log('Generating JWT token for user:', payload.userId);
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};