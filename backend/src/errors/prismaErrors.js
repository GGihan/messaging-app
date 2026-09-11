import { Prisma } from "../../generated/prisma/index.js";
import { BadRequestError, ConflictError, NotFoundError } from "./AppError.js";

export function handlePrismaError(err) {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  switch (err.code) {
    case 'P2025':
      return new NotFoundError(err.meta?.cause || 'Resource not found');
    case 'P2002':
      return new ConflictError('A record with this value already exists');
    case 'P2003':
      return new BadRequestError('Invalid foreign key reference');
    default:
      return new BadRequestError('Database operation failed');
  }
};