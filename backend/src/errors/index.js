import { handlePrismaError } from "./prismaErrors.js";

const errorTransformers = [
  handlePrismaError,
  // add new transformers here
];

export function normalizeError(err) {
  // If custom AppErrors
  if (err.isOperational) {
    return err;
  }

  // Run through transformers until one converts it
  for (const transform of errorTransformers) {
    const transformed = transform(err);
  
    if (transformed && transformed !== err) {
      return transformed;
    }
  }

  // Fallback for unhandled native JS errors
  return err;
}