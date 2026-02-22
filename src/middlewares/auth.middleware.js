const jwt = require('jsonwebtoken');

/**
 * Middleware to protect routes - requires valid JWT token
 */
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route. Please provide a valid token.'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Add user info to request object
            req.user = {
                _id: decoded.id,
                email: decoded.email,
                role: decoded.role
            };

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in authentication'
        });
    }
};

/**
 * Middleware to restrict access to specific roles
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }

        next();
    };
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes that have different behavior for authenticated users
 */
exports.optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = {
                    _id: decoded.id,
                    email: decoded.email,
                    role: decoded.role
                };
            } catch (error) {
                // Invalid token, but we don't fail - just continue without user
                console.log('Optional auth: Invalid token provided');
            }
        }

        next();
    } catch (error) {
        console.error('Optional auth error:', error);
        next();
    }
};
