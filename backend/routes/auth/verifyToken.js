const jwt = require("jsonwebtoken");
const config = require("../../config");

const verifyToken = (req, res, next) => {
    console.log("Verify Token request received");
    const bearerToken = req.headers.authorization;
    const token = bearerToken && bearerToken.split(' ')[1]
    if (token == null) {
        res.status(401).json({ message: "Unauthorized access" });
    }
    else {
        jwt.verify(token, config.tokenKey, (err, decodedToken) => {
            if (err) {
                res.status(401).json({ message: "Unauthorized access" });
            }
            else {
                res.locals.data = decodedToken;
                next();
            }
        })
    }
}

module.exports = verifyToken;