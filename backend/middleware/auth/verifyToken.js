const {dbAuth} = require('../../db');

const verifyToken = async (req, res, next) => {
    console.log("Verify Token request received");
    const idToken = req.headers.authorization;
    const token = idToken && idToken.split(' ')[1]
    try {
        const decodedToken = await dbAuth.verifyIdToken(token);
        res.locals.data = decodedToken;
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthorized", code: 401, status: 'error', errorMessage: "Unauthorized" })
    }
}

module.exports = verifyToken;