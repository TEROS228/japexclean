// lib/rate-limit.ts - Rate limiting middleware to prevent API abuse
import { NextApiRequest, NextApiResponse } from 'next';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  interval: number; // Time window in milliseconds
  limit: number; // Max requests per interval
}

/**
 * Rate limiting middleware
 *
 * Usage:
 * ```ts
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   if (!rateLimit(req, res, { interval: 60000, limit: 10 })) return;
 *   // Your API logic
 * }
 * ```
 */
export function rateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  options: RateLimitOptions = { interval: 60000, limit: 60 }
): boolean {
  // Get client identifier (IP address or user ID)
  const identifier =
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    'unknown';

  const key = `${identifier}:${req.url}`;
  const now = Date.now();

  // Initialize or get existing rate limit data
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + options.interval,
    };
    return true;
  }

  // Increment count
  store[key].count++;

  // Check if limit exceeded
  if (store[key].count > options.limit) {
    const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    res.setHeader('X-RateLimit-Limit', options.limit.toString());
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', store[key].resetTime.toString());
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
    });
    return false;
  }

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', options.limit.toString());
  res.setHeader(
    'X-RateLimit-Remaining',
    (options.limit - store[key].count).toString()
  );
  res.setHeader('X-RateLimit-Reset', store[key].resetTime.toString());

  return true;
}

/**
 * Higher-order function for rate limiting
 */
export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options?: RateLimitOptions
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (!rateLimit(req, res, options)) return;
    return handler(req, res);
  };
}
