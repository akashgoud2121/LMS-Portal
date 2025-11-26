// Security middleware
// Simple in-memory rate limiting (for production, consider using Redis)
const rateLimitStore = new Map();

// Security headers
const securityHeaders = (req, res, next) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (adjust as needed)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Content-Security-Policy', "default-src 'self'");
  }
  
  next();
};

// Simple rate limiting middleware
const createRateLimiter = (windowMs, maxRequests) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const key = `${ip}-${req.path}`;
    
    // Clean old entries (simple cleanup)
    if (rateLimitStore.size > 10000) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (now - v.firstRequest > windowMs) {
          rateLimitStore.delete(k);
        }
      }
    }
    
    const record = rateLimitStore.get(key);
    
    if (!record) {
      rateLimitStore.set(key, {
        count: 1,
        firstRequest: now,
        resetTime: now + windowMs
      });
      return next();
    }
    
    // Reset if window has passed
    if (now > record.resetTime) {
      record.count = 1;
      record.firstRequest = now;
      record.resetTime = now + windowMs;
      return next();
    }
    
    // Check if limit exceeded
    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        message: 'Too many requests from this IP, please try again later.',
        retryAfter
      });
    }
    
    record.count++;
    next();
  };
};

// Rate limiting for API routes
const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === 'production' ? 100 : 1000 // Max requests
);

// Stricter rate limiting for auth routes
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === 'production' ? 5 : 20 // Max requests
);

module.exports = {
  securityHeaders,
  apiLimiter,
  authLimiter
};

