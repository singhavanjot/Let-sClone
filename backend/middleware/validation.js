/**
 * Validation Middleware
 * Request validation using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * User registration validation
 */
const registerValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  validate
];

/**
 * User login validation
 */
const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

/**
 * Device registration validation
 */
const deviceValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Device name must be between 1 and 100 characters'),
  body('type')
    .optional()
    .isIn(['desktop', 'laptop', 'mobile', 'tablet', 'other'])
    .withMessage('Invalid device type'),
  body('os')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('OS name too long'),
  body('browser')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Browser name too long'),
  validate
];

/**
 * Session creation validation
 */
const createSessionValidation = [
  body('deviceId')
    .notEmpty()
    .withMessage('Device ID is required'),
  body('connectionType')
    .optional()
    .isIn(['view-only', 'full-control'])
    .withMessage('Invalid connection type'),
  validate
];

/**
 * Join session validation
 */
const joinSessionValidation = [
  body('sessionCode')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Session code must be 6 characters')
    .isAlphanumeric()
    .withMessage('Session code must be alphanumeric'),
  body('deviceId')
    .notEmpty()
    .withMessage('Device ID is required'),
  validate
];

/**
 * MongoDB ObjectId validation
 */
const objectIdValidation = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
  validate
];

/**
 * Pagination validation
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  deviceValidation,
  createSessionValidation,
  joinSessionValidation,
  objectIdValidation,
  paginationValidation
};
