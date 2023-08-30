const log = require('../middleware/logger/Logger').create(__filename.slice(__dirname.length + 1))
const config = require('../config');
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const bearerToken = req.headers.authorization;
    const token = bearerToken && bearerToken.split(' ')[1]
    if (token == null) {
        log.warn("Unauthorized access (Empty Token pssed)")
        res.status(401).json({ message: "Unauthorized access (Empty Token pssed)" });
    }
    else {
        jwt.verify(token, config.tokenKey, (err, decodedToken) => {
            if (err) {
                res.status(401).json({ message: "Unauthorized access" });
                log.warn("Token expired");
            }
            else {
                res.locals.data = decodedToken;
                log.info("Token verified")
                next();
            }
        })
    }
}

module.exports = {
    verifyToken
}