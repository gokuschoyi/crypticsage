const { OAuth2Client } = require('google-auth-library');
const config = require('../config');

const verifyGoogleCredentials = async (credentials) => {
    let payload = {};
    try {
        const client = new OAuth2Client(config.googleOAuthClientId);
        const ticket = await client.verifyIdToken({
            idToken: credentials,
            audience: config.googleOAuthClientId,
        });
        payload = ticket.getPayload();
        return payload
    } catch (err) {
        throw new Error("(Google-Auth):Cannot verify your google account")
    }
}

module.exports = {
    verifyGoogleCredentials
}