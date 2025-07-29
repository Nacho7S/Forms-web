
module.exports = {
    success: (res, data = null, message = '', status = 200) => res.status(status).json({
        success: true,
        message,
        data
    }),
    error: (res, error = {}) => res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Internal Server Error',
        details: error.details || null,
        code: error.code || null
    })
};