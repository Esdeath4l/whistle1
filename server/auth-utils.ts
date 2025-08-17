import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { RequestHandler } from 'express';

// JWT token creation
export const createToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  return jwt.sign(
    { id: userId, iat: Date.now() },
    secret,
    {
      expiresIn: '1h',
      algorithm: 'HS256'
    }
  );
};

// Set secure authentication cookie
export const setAuthCookie = (res: any, token: string): void => {
  res.cookie('auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 3600000, // 1 hour
    path: '/'
  });
};

// Hash password securely
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password against hash
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  return jwt.verify(token, secret);
};

// Middleware to authenticate admin requests
export const authenticateAdmin: RequestHandler = (req, res, next) => {
  try {
    // Try cookie first, then Authorization header
    let token = req.cookies?.auth;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Generate secure admin credentials hash
export const generateAdminHash = async (username: string, password: string): Promise<string> => {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  
  // Create a combined string and hash it securely
  const combined = `${username}:${password}:${encryptionKey}`;
  return await hashPassword(combined);
};

// Verify admin credentials
export const verifyAdminCredentials = async (
  username: string,
  password: string,
  storedHash: string
): Promise<boolean> => {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  
  const combined = `${username}:${password}:${encryptionKey}`;
  return await verifyPassword(combined, storedHash);
};
