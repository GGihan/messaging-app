import { validationResult } from 'express-validator';

export const handleValidation = (req, res, next) => {
  const errors = validationResult(req).formatWith(({ path, msg }) => ({
    field: path,
    message: msg
  }));
  // Returns: { "field": "username", "message": "Too short" },
  //          { "field": "email", "message": "Invalid address" }

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array(), 
    });
  }

  next();
};