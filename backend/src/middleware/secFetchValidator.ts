import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import config, { getAllowedOrigins } from '../config/index.js';

/**
 * Middleware to validate Sec-Fetch-Site header on mutating requests
 * Prevents CSRF attacks by checking the fetch origin
 */
export const secFetchValidator = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const method = req.method;

  // Only validate mutating requests
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    next();
    return;
  }

  const secFetchSite = req.headers['sec-fetch-site'];
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  // If Sec-Fetch-Site header is not present, skip validation
  // (mobile apps and some clients don't send this header)
  if (!secFetchSite) {
    logger.debug(`Sec-Fetch-Site header not present for ${method} ${req.path}`);
    next();
    return;
  }

  // Allow same-origin, same-site, and none (for mobile apps)
  const allowedValues = ['same-origin', 'same-site', 'none'];
  if (allowedValues.includes(secFetchSite as string)) {
    next();
    return;
  }

  // If cross-site, check if origin is in allowed list
  if (secFetchSite === 'cross-site') {
    if (origin && allowedOrigins.includes(origin)) {
      logger.debug(`Cross-site request allowed for origin: ${origin}`);
      next();
      return;
    }

    // Block cross-site requests from unknown origins
    logger.warn(
      `Blocked cross-site ${method} request from origin: ${origin} to ${req.path}`
    );
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Cross-origin request not allowed',
      },
    });
    return;
  }

  // Block unknown Sec-Fetch-Site values
  logger.warn(
    `Blocked request with invalid Sec-Fetch-Site header: ${secFetchSite}`
  );
  res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Invalid request origin',
    },
  });
};
