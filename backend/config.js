'use strict';
const dotenv = require('dotenv');
const assert = require('assert');
dotenv.config();

const {
    PORT,
    HOST,
    HOST_URL,
    REDIS_PORT,
    REDIS_HOST,
    WEBSOCKET_FLAG,
    SOCKET_PORT,
    MONGO_URI,
    TOKEN_SECRET_KEY,
    TOKEN_EXPIRATION_TIME,
    GOOGLE_OAUTH_CLIENT_ID,
    SCHEDULER_FLAG,
    HTTPS_FLAG,
    MODEL_TRAINING_DEBUG_FLAG,
    SINGLE_STEP_TYPE_ONE,
    SINGLE_STEP_TYPE_TWO
} = process.env;

assert(PORT, 'PORT is required');
assert(HOST, 'HOST is required');

module.exports = {
    port: PORT,
    host: HOST,
    url: HOST_URL,
    redis_host: REDIS_HOST,
    redis_port: REDIS_PORT,
    websocketFlag: WEBSOCKET_FLAG,
    wsPort: SOCKET_PORT,
    mongoUri: MONGO_URI,
    tokenKey: TOKEN_SECRET_KEY,
    tokenExpirationTime: TOKEN_EXPIRATION_TIME,
    googleOAuthClientId: GOOGLE_OAUTH_CLIENT_ID,
    schedulerFlag: SCHEDULER_FLAG,
    https_flag: HTTPS_FLAG,
    debug_flag: MODEL_TRAINING_DEBUG_FLAG,
    single_step_type_one: SINGLE_STEP_TYPE_ONE,
    single_step_type_two: SINGLE_STEP_TYPE_TWO
};