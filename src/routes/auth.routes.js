const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

/**
 * @desc    Admin login
 * @route   POST /api/auth/login
 * @access  Public
 */
router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // In production, you would check against a User model in the database
        // For now, we'll use environment variables for a simple admin login
        
        if (email !== process.env.ADMIN_EMAIL) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, await bcrypt.hash(process.env.ADMIN_PASSWORD, 10));
        
        // For development, simple comparison (CHANGE IN PRODUCTION!)
        const validPassword = password === process.env.ADMIN_PASSWORD;

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create JWT token
        const token = jwt.sign(
            {
                id: 'admin-001',
                email: email,
                role: 'admin'
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                email,
                role: 'admin'
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @desc    Verify token
 * @route   GET /api/auth/verify
 * @access  Private
 */
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        res.status(200).json({
            success: true,
            user: {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role
            }
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

/**
 * @desc    Change password
 * @route   POST /api/auth/change-password
 * @access  Private
 */
router.post('/change-password', [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { currentPassword, newPassword } = req.body;

        // Verify current password
        if (currentPassword !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // In production, you would:
        // 1. Hash the new password
        // 2. Update it in the database
        // For now, we'll just inform the user to update the .env file

        res.status(200).json({
            success: true,
            message: 'Password change initiated. Please update ADMIN_PASSWORD in .env file manually.',
            note: 'In production, this would update the database automatically'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
