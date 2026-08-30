import { body, param } from "express-validator";
import { prisma } from "../../lib/prisma.js";

// Error messages
const emptyErr = 'can\'t be empty.';
const usernameLengthErr = 'must be between 3 and 30 characters.';
const passwordLengthErr = 'must be between 8 and 72 characters.';
const symbolErr = 'can only contain letters, numbers, underscores, and hyphens.';

// Validations
export const validateRegister = [
  body('username')
    .trim()
    .notEmpty().withMessage(`Username ${emptyErr}`)
    .bail()
    .isLength({ min: 3, max: 30 }).withMessage(`Username ${usernameLengthErr}`)
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage(`Username ${symbolErr}`)
    // Check if username already exists
    .custom(async (value) => {
      const user = await prisma.user.findUnique({ where: { username: value } });
      if (user) {
        throw new Error('Username is already taken.');
      }
    }),
  body('password')
    .notEmpty().withMessage(`Password ${emptyErr}`)
    .bail()
    .isLength({ min: 8, max: 72 }).withMessage(`Password ${passwordLengthErr}`),
  body('passwordConfirm')
    .custom((value, {req}) => {
      return value === req.body.password;
    }).withMessage(`Passwords do not match.`),
];

export const validateLogIn = [
  body('username')
    .trim()
    .notEmpty().withMessage(`Username ${emptyErr}`),
  body('password')
    .notEmpty().withMessage(`Password ${emptyErr}`),
];

export const validateUuidParam = (paramName = "id") => [
  param(paramName)
    .isUUID().withMessage(`Invalid ${paramName} format. Must be a valid UUID.`),
];

export const validateUuidBody = (fieldName = "id") => [
  body(fieldName)
    .notEmpty().withMessage(`${fieldName} ${emptyErr}`)
    .isUUID().withMessage(`Invalid ${fieldName} format. Must be a valid UUID.`),
];

export const validateIdParam = (paramName = "id") => [
  param(paramName)
    .isInt({ min: 1 })
    .toInt().withMessage(`Invalid ${paramName} format. Must be a valid ID.`),
];

export const validateIdBody = (fieldName = "id") => [
  body(fieldName)
    .notEmpty().withMessage(`${fieldName} ${emptyErr}`)
    .isInt({ min: 1 })
    .toInt().withMessage(`Invalid ${fieldName} format. Must be a valid ID.`),
];