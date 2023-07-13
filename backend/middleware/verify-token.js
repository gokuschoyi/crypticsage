const config = require('../config');
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const bearerToken = req.headers.authorization;
    const token = bearerToken && bearerToken.split(' ')[1]
    if (token == null) {
        res.status(401).json({ message: "Unauthorized access" });
    }
    else {
        jwt.verify(token, config.tokenKey, (err, decodedToken) => {
            if (err) {
                res.status(401).json({ message: "Unauthorized access" });
                console.log("Token expired");
            }
            else {
                res.locals.data = decodedToken;
                console.log("Token verified")
                next();
            }
        })
    }
}

module.exports = {
    verifyToken
}