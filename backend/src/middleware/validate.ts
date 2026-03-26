import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import logger from "../utils/logger.js";

interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Zod validation middleware factory
 * Validates request body, query, and params against provided schemas
 */
export const validate = (options: ValidationOptions) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const errors: Record<string, string[]> = {};

    // Validate body
    if (options.body) {
      try {
        req.body = await options.body.parseAsync(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          errors.body = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        }
      }
    }

    // Validate query
    if (options.query) {
      try {
        req.query = await options.query.parseAsync(req.query);
      } catch (error) {
        if (error instanceof ZodError) {
          errors.query = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        }
      }
    }

    // Validate params
    if (options.params) {
      try {
        req.params = await options.params.parseAsync(req.params);
      } catch (error) {
        if (error instanceof ZodError) {
          errors.params = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        }
      }
    }

    // If there are validation errors, return 400
    if (Object.keys(errors).length > 0) {
      logger.warn("Validation error", errors);
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: errors,
        },
      });
      return;
    }

    next();
  };
};
