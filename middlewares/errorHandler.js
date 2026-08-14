const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    if (process.env.NODE_ENV === 'production') {
        res.status(statusCode).json({
            status: 'error',
            message: statusCode === 500 ? 'Internal Server Error' : err.message || 'An error occurred',
        });
    } else {
        res.status(statusCode).json({
            status: 'error',
            message: err.message || 'Internal Server Error',
            stack: err.stack,
        });
    }
};

module.exports = { errorHandler };
