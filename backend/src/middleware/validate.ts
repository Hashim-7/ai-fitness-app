import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

export function validate<T>(
  schema: ZodType<T>,
  source: "body" | "query" | "params" = "body",
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      // Pull the custom error string from the very first failing field validation
      const topError = result.error.issues[0]?.message || "Validation failed";

      return res.status(400).json({
        message: topError,
        errors: result.error.format(), // format() replaces the deprecated flatten()
      });
    }

    req[source] = result.data;
    next();
  };
}
