const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const { OAuth2Client } = require('google-auth-library');
const config = require('../config');
const client = new OAuth2Client();

const verifyGoogleCredentials = async (credentials) => {
    let payload = {};
    try {
        const ticket = await client.verifyIdToken({
            idToken: credentials,
            audience: config.googleOAuthClientId,
        });
        payload = ticket.getPayload();
        return payload
    } catch (error) {
        const errorMessage = error.message
        const allowedErrorPattern = /Token used too early/
        if (errorMessage.match(allowedErrorPattern)) {
            log.warn('Token used too early, error. Allowing access')
            let payload = {}
            let dataPattern = /({.*})/
            let matched = errorMessage.match(dataPattern)
            if (matched && matched[1]) {
                log.info('User data found')
                payload = JSON.parse(matched[1])
                return payload
            } else {
                log.warn('No JSON data found in the error message.');
                let formattedError = JSON.stringify(logger.formatError(error))
                log.error({ message: '(Google-Auth):Cannot verify your google account', error: formattedError })
                throw error
            }
        } else {
            let formattedError = JSON.stringify(logger.formatError(error))
            log.error({ message: '(Google-Auth):Cannot verify your google account', error: formattedError })
            throw error
        }
    }
}

module.exports = {
    verifyGoogleCredentials
}