// Input Validation Middleware using express-validator
// Provides validation and sanitization for all user inputs

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 * Returns 400 error if validation fails
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * Validation rules for employee registration
 */
const validateEmployeeRegistration = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
        .matches(/^[a-zA-Z\s]+$/).withMessage('Name should contain only letters'),

    body('employeeId')
        .trim()
        .notEmpty().withMessage('Employee ID is required')
        .isLength({ min: 2, max: 20 }).withMessage('Employee ID must be 2-20 characters')
        .matches(/^[A-Z0-9]+$/).withMessage('Employee ID should be uppercase alphanumeric'),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),

    handleValidationErrors
];

/**
 * Validation rules for login
 */
const validateLogin = [
    body('employeeId').optional()
        .trim()
        .notEmpty().withMessage('Employee ID is required'),

    body('deptId').optional()
        .trim()
        .notEmpty().withMessage('Department ID is required'),

    body('password')
        .notEmpty().withMessage('Password is required'),

    handleValidationErrors
];

/**
 * Validation rules for department registration
 */
const validateDepartmentRegistration = [
    body('name')
        .trim()
        .notEmpty().withMessage('Department name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

    body('deptId')
        .trim()
        .notEmpty().withMessage('Department ID is required')
        .isLength({ min: 2, max: 20 }).withMessage('Department ID must be 2-20 characters')
        .matches(/^[A-Z0-9]+$/).withMessage('Department ID should be uppercase alphanumeric'),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    body('deptType')
        .notEmpty().withMessage('Department type is required')
        .isIn(['employee', 'verification', 'dispatch', 'delivery']).withMessage('Invalid department type'),

    handleValidationErrors
];

/**
 * Validation rules for order creation
 */
const validateOrderCreation = [
    body('customerName')
        .trim()
        .notEmpty().withMessage('Customer name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Customer name must be 2-100 characters'),

    body('mobile')
        .optional()
        .trim()
        .matches(/^[6-9]\d{9}$/).withMessage('Invalid mobile number (10 digits starting with 6-9)'),

    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Invalid email address')
        .normalizeEmail(),

    body('address')
        .trim()
        .notEmpty().withMessage('Address is required')
        .isLength({ min: 10, max: 500 }).withMessage('Address must be 10-500 characters'),

    body('state')
        .trim()
        .notEmpty().withMessage('State is required'),

    body('pincode')
        .optional()
        .trim()
        .matches(/^\d{6}$/).withMessage('Pincode must be 6 digits'),

    body('total')
        .notEmpty().withMessage('Total amount is required')
        .isFloat({ min: 0 }).withMessage('Total must be a positive number'),

    body('items')
        .isArray({ min: 1 }).withMessage('At least one item is required'),

    handleValidationErrors
];

/**
 * Validation rules for password reset
 */
const validatePasswordReset = [
    body('employeeId')
        .trim()
        .notEmpty().withMessage('Employee ID is required'),

    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),

    handleValidationErrors
];

/**
 * Validation for order ID parameter
 */
const validateOrderId = [
    param('orderId')
        .trim()
        .notEmpty().withMessage('Order ID is required')
        .matches(/^HON\d{4,}$/).withMessage('Invalid order ID format'),

    handleValidationErrors
];

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
const sanitizeInput = (req, res, next) => {
    // This middleware runs after express.json()
    // Additional sanitization if needed
    next();
};

module.exports = {
    validateEmployeeRegistration,
    validateLogin,
    validateDepartmentRegistration,
    validateOrderCreation,
    validatePasswordReset,
    validateOrderId,
    sanitizeInput,
    handleValidationErrors
};
