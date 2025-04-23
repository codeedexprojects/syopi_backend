// firebaseAdmin.js
const admin = require('firebase-admin');
// const serviceAccount = require('../firebase-adminsdk.json');
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_CONFIG, 'base64').toString('utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
