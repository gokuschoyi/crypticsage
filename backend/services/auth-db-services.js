const { OAuth2Client } = require('google-auth-library');
const { connect } = require('./db-conn')
const config = require('../config');

const getUserByEmail = async (email, connectMessage) => {
    const db = await connect(connectMessage);
    const userCollection = db.collection('users');
    const filterEmail = { email: email }
    const user = await userCollection.find(filterEmail).toArray();
    return [user, userCollection]
}

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
        return payload
    }
}

module.exports = {
    getUserByEmail,
    verifyGoogleCredentials
}