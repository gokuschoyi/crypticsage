'use strict';
const dotenv = require('dotenv');
const assert = require('assert');
dotenv.config();

const {
    PORT,
    HOST,
    HOST_URL,
    MONGO_URI,
    TOKEN_SECRET_KEY,
    GOOGLE_OAUTH_CLIENT_ID

} = process.env;

assert(PORT, 'PORT is required');
assert(HOST, 'HOST is required');

module.exports = {
    port: PORT,
    host: HOST,
    url: HOST_URL,
    mongoUri: MONGO_URI,
    tokenKey: TOKEN_SECRET_KEY,
    googleOAuthClientId: GOOGLE_OAUTH_CLIENT_ID,
};