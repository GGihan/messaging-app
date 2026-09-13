import { body, param, query } from "express-validator";
import { prisma } from "../../lib/prisma.js";

// Error messages
const emptyErr = 'can\'t be empty.';
const usernameLengthErr = 'must be between 3 and 30 characters.';
const groupNameLengthErr = 'must be between 3 and 50 characters.';
const passwordLengthErr = 'must be between 8 and 72 characters.';
const symbolErr = 'can only contain letters, numbers, underscores, and hyphens.';
const stringErr = 'must be a string.';
const arrayErr = 'must be an array.';

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
        throw new Error('Username is already taken');
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

export const validateUserSearchQuery = [
  query('search')
    .optional()
    .trim()
    .isString().withMessage(`Search query ${stringErr}`)
    .isLength({ max: 30 }).withMessage('Search query cannot exceed 30 characters.'),
];

export const validateChatSearchQuery = [
  query('search')
    .optional()
    .trim()
    .isString().withMessage(`Chat query ${stringErr}`)
    .isLength({ max: 50 }).withMessage('Search query cannot exceed 50 characters.'),
];

export const validateFriendshipQuery = [
  query('status')
    .optional()
    .trim()
    .isIn(['PENDING', 'ACCEPTED', 'DECLINED', 'BLOCKED'])
    .withMessage('Status must be one of: PENDING, ACCEPTED, DECLINED, BLOCKED.'),
  query('type')
    .optional()
    .isIn(['incoming', 'outgoing'])
    .withMessage('Type must be either "incoming" or "outgoing".'),
];

export const validateUpdateProfile = [
  body('displayName')
    .optional()
    .trim()
    .notEmpty().withMessage(`Display name ${emptyErr}`)
    .bail()
    .isLength({ min: 3, max: 30 }).withMessage(`Display name ${usernameLengthErr}`)
    .matches(/^[a-zA-Z0-9_ -]+$/).withMessage(`Display name ${symbolErr}`),
  body('bio')
    .optional()
    .trim()
    .notEmpty().withMessage(`Bio ${emptyErr}`)
    .bail()
    .isLength({ max: 100 }).withMessage(`Bio cannot exceed 100 characters.`),
];

export const validateReceiverBody = [
  body('receiverId')
    .custom((value, { req }) => {
      if (value === req.user?.id) {
        throw new Error('Receiver cannot be yourself');
      }
      return true;
    })
    .custom(async (value) => {
      const receiver = await prisma.user.findUnique({
        where: { id: value },
        select: { id: true },
      });

      if (!receiver) {
        throw new Error('User not found');
      }
      return true;
    }),
];

export const validateReceiverParam = [
  param('receiverId')
    .custom((value, { req }) => {
      if (value === req.user?.id) {
        throw new Error('Receiver cannot be yourself');
      }
      return true;
    })
    .custom(async (value) => {
      const receiver = await prisma.user.findUnique({
        where: { id: value },
        select: { id: true },
      });

      if (!receiver) {
        throw new Error('User not found');
      }
      return true;
    }),
];

export const validateStatus = [
  body('status')
    .notEmpty().withMessage(`Status ${emptyErr}`)
    .bail()
    .isIn(['ACCEPTED', 'DECLINED']),
];

export const validateRole = [
  body('role')
    .notEmpty().withMessage(`Role ${emptyErr}`)
    .bail()
    .isIn(['ADMIN', 'MEMBER']),
];

export const validateCreateGroupChat = [
  body('name')
    .trim()
    .notEmpty().withMessage(`Name ${emptyErr}`)
    .bail()
    .isLength({ min: 3, max: 50 }).withMessage(`Name ${groupNameLengthErr}`),
  body('memberIds')
    .optional()
    .isArray().withMessage(`memberIds ${arrayErr}`)
    .bail()
    .custom((memberIds, { req }) => {
      // Prevent duplicate entries
      const uniqueIds = new Set(memberIds);
      if (uniqueIds.size !== memberIds.length) {
        throw new Error('Duplicate member IDs are not allowed');
      }
      // Prevent the creator from adding themselves in the memberIds array
      if (req.user && memberIds.includes(req.user.id)) {
        throw new Error('You cannot add yourself to memberIds');
      }

      return true;
    }),
  body('memberIds.*')
    .optional()
    .isUUID().withMessage('Invalid member ID must be a valid UUID.'),
];

export const validateUpdateGroupChat = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage(`Name ${emptyErr}`)
    .bail()
    .isLength({ min: 3, max: 50 }).withMessage(`Name ${groupNameLengthErr}`),
];

export const validateCreateMessage = [
  body('text')
    .optional()
    .trim()
    .notEmpty().withMessage(`Text ${emptyErr}`)
    .bail()
    .isLength({ max: 1000 }).withMessage(`Text cannot exceed 1000 characters.`),
  // check if atleast text or image exists
  body().custom((value, { req }) => {
    const hasText = req.body.text && req.body.text.trim().length > 0;
    const hasFile = Boolean(req.file);

    if (!hasText && !hasFile) {
      throw new Error('A message must contain either text or an attachment');
    }

    return true;
  }),
];

export const validateAddChatMember = [
  body('userIds')
    .isArray().withMessage(`userIds ${arrayErr}`)
    .bail()
    .custom((userIds, { req }) => {
      // Prevent duplicate entries
      const uniqueIds = new Set(userIds);
      if (uniqueIds.size !== userIds.length) {
        throw new Error('Duplicate member IDs are not allowed');
      }
      // Prevent the creator from adding themselves in the userIds array
      if (req.user && userIds.includes(req.user.id)) {
        throw new Error('You cannot add yourself to userIds');
      }

      return true;
    }),
  body('userIds.*')
    .isUUID().withMessage('Invalid user ID must be a valid UUID'),
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