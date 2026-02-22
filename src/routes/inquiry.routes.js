const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    createInquiry,
    getAllInquiries,
    getInquiryById,
    updateInquiry,
    addNote,
    deleteInquiry,
    getStats
} = require('../controllers/inquiry.controller.js');
const { protect, authorize } = require('../middlewares/auth.middleware.js');

// Validation middleware for inquiry creation
const validateInquiry = [
    body('company')
        .trim()
        .notEmpty().withMessage('Company name is required')
        .isLength({ min: 2, max: 200 }).withMessage('Company name must be between 2 and 200 characters'),
    
    body('name')
        .trim()
        .notEmpty().withMessage('Contact person name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('phone')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .matches(/^[\d\s\+\-\(\)]+$/).withMessage('Please provide a valid phone number'),
    
    body('interest')
        .notEmpty().withMessage('Product interest is required')
        .isIn(['biofertilizer', 'reactor', 'bioplastic', 'multiple', 'custom'])
        .withMessage('Invalid product interest'),
    
    body('volume')
        .optional()
        .isInt({ min: 0, max: 100000000 }).withMessage('Volume must be a positive number'),
    
    body('message')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters')
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => err.msg)
        });
    }
    next();
};

// Public routes
router.post('/', validateInquiry, handleValidationErrors, createInquiry);

// Protected routes (require authentication)
// In production, add protect middleware to these routes
// Example: router.get('/', protect, authorize('admin'), getAllInquiries);

// For now, these are unprotected for development
// IMPORTANT: Add authentication before deploying to production!
router.get('/', getAllInquiries);
router.get('/stats', getStats);
router.get('/:id', getInquiryById);
router.patch('/:id', updateInquiry);
router.post('/:id/notes', addNote);
router.delete('/:id', deleteInquiry);

module.exports = router;
