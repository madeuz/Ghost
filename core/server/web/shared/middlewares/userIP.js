module.exports = (req, res, next) => {
    req.body.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    next();
};
