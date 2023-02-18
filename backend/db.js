const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const credentials = require('./crypticsage_key.json');

initializeApp({
    credential: cert(credentials),
});

const db = getFirestore();
const dbAuth = require('firebase-admin').auth();

module.exports = { db, dbAuth };