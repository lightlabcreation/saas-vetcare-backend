const jwt = require('jsonwebtoken');

const superAdminAuth = (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ status: 'error', message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey123');

        // Check specifically for SUPER_ADMIN role
        if (decoded.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ status: 'error', message: 'Forbidden: Super Admin access required' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('Super Admin Auth Middleware Error:', error);
        res.status(401).json({ status: 'error', message: 'Not authorized, token failed' });
    }
};

module.exports = superAdminAuth;
