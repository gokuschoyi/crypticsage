const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
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
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error({ message: '(Google-Auth):Cannot verify your google account', error: formattedError })
        throw error
    }
}

module.exports = {
    verifyGoogleCredentials
}