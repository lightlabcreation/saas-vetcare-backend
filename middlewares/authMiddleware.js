const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
    let token;
    
    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Bearer <token>)
            token = req.headers.authorization.split(' ')[1];
            
            // Verify token signature & expiry
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey123');
            
            // If token has embedded sessionId, verify against active session in DB for single session enforcement
            if (decoded.id && decoded.sessionId) {
                const [users] = await db.query(
                    'SELECT id, status, current_session_token, role, clinic_id, name FROM users WHERE id = ?', 
                    [decoded.id]
                );
                
                if (users.length === 0 || users[0].status !== 'Active') {
                    return res.status(401).json({ 
                        status: 'error', 
                        code: 'USER_INACTIVE', 
                        message: 'User account is inactive or not found' 
                    });
                }
                
                // Concurrent Login Check: If session token does not match latest login, terminate this session
                if (users[0].current_session_token && users[0].current_session_token !== decoded.sessionId) {
                    return res.status(401).json({
                        status: 'error',
                        code: 'SESSION_TERMINATED',
                        message: 'Your account was logged in from another device/browser. For security, this session has been ended.'
                    });
                }
            }
            
            // Set user in request object
            req.user = decoded; // Contains { id, role, email, clinic_id, sessionId }
            
            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            return res.status(401).json({ status: 'error', code: 'INVALID_TOKEN', message: 'Not authorized, session token invalid or expired' });
        }
    } else {
        return res.status(401).json({ status: 'error', code: 'NO_TOKEN', message: 'Not authorized, no token provided' });
    }
};

// Middleware to check roles (RBAC)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                status: 'error', 
                code: 'FORBIDDEN',
                message: `User role '${req.user ? req.user.role : 'Unknown'}' is not authorized to access this route` 
            });
        }
        next();
    };
};

module.exports = { protect, authorize };

