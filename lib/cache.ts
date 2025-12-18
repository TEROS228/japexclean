// lib/cache.ts - Redis cache wrapper with fallback to memory cache
import Redis from 'ioredis';
import type { Redis as RedisType } from 'ioredis';

// Memory cache fallback (if Redis not available)
const memoryCache = new Map<string, { value: any; expires: number }>();

// Redis client (lazy initialization)
let redisClient: RedisType | null = null;
let redisAvailable = false;

// Initialize Redis connection
function getRedisClient(): RedisType | null {
  if (redisClient) return redisClient;

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('Redis unavailable, using memory cache');
          redisAvailable = false;
          return null;
        }
        return Math.min(times * 200, 1000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
      redisAvailable = true;
    });

    redisClient.on('error', (err) => {
      console.warn('⚠️ Redis error:', err.message);
      redisAvailable = false;
    });

    // Try to connect
    redisClient.connect().catch(() => {
      console.warn('⚠️ Redis not available, using memory cache');
      redisAvailable = false;
    });

    return redisClient;
  } catch (error) {
    console.warn('⚠️ Redis initialization failed:', error);
    redisAvailable = false;
    return null;
  }
}

// Clean expired memory cache entries
function cleanMemoryCache() {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expires < now) {
      memoryCache.delete(key);
    }
  }
}

// Set interval to clean memory cache every 5 minutes
setInterval(cleanMemoryCache, 5 * 60 * 1000);

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

/**
 * Get value from cache
 */
export async function cacheGet<T = any>(key: string): Promise<T | null> {
  // Try Redis first
  if (redisAvailable) {
    const client = getRedisClient();
    if (client) {
      try {
        const value = await client.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
      } catch (error) {
        console.warn('Redis get error:', error);
        redisAvailable = false;
      }
    }
  }

  // Fallback to memory cache
  const entry = memoryCache.get(key);
  if (entry) {
    if (entry.expires > Date.now()) {
      return entry.value as T;
    } else {
      memoryCache.delete(key);
    }
  }

  return null;
}

/**
 * Set value in cache
 */
export async function cacheSet(
  key: string,
  value: any,
  options: CacheOptions = {}
): Promise<void> {
  const { ttl = 3600 } = options; // Default 1 hour
  const serialized = JSON.stringify(value);

  // Try Redis first
  if (redisAvailable) {
    const client = getRedisClient();
    if (client) {
      try {
        await client.setex(key, ttl, serialized);
        return;
      } catch (error) {
        console.warn('Redis set error:', error);
        redisAvailable = false;
      }
    }
  }

  // Fallback to memory cache
  memoryCache.set(key, {
    value,
    expires: Date.now() + ttl * 1000,
  });
}

/**
 * Delete value from cache
 */
export async function cacheDel(key: string): Promise<void> {
  // Try Redis first
  if (redisAvailable) {
    const client = getRedisClient();
    if (client) {
      try {
        await client.del(key);
      } catch (error) {
        console.warn('Redis del error:', error);
      }
    }
  }

  // Also delete from memory cache
  memoryCache.delete(key);
}

/**
 * Clear cache by pattern
 */
export async function cacheClear(pattern: string = '*'): Promise<void> {
  // Try Redis first
  if (redisAvailable) {
    const client = getRedisClient();
    if (client) {
      try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          await client.del(...keys);
        }
      } catch (error) {
        console.warn('Redis clear error:', error);
      }
    }
  }

  // Clear memory cache matching pattern
  if (pattern === '*') {
    memoryCache.clear();
  } else {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
  }
}

/**
 * Wrapper for cached function execution
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache
  const cachedValue = await cacheGet<T>(key);
  if (cachedValue !== null) {
    return cachedValue;
  }

  // Execute function and cache result
  const result = await fn();
  await cacheSet(key, result, options);
  return result;
}

// Legacy compatibility functions
export function getCached(subcategoryId: string, page: number, sortOrder: string) {
  const key = `legacy_${subcategoryId}_${page}_${sortOrder}`;
  return cacheGet(key);
}

export function setCached(subcategoryId: string, page: number, sortOrder: string, data: any, ttlSeconds: number) {
  const key = `legacy_${subcategoryId}_${page}_${sortOrder}`;
  return cacheSet(key, data, { ttl: ttlSeconds });
}

export function clearCache() {
  return cacheClear();
}

// Initialize Redis on module load
getRedisClient();
