'use strict';

const { auth } = require('google-auth-library');
const admin = require('firebase-admin');

const { Firestore } = require('@google-cloud/firestore');

const connectionTest = async (firestore) => {
  const results = await firestore.collection('multimodalUserStateParams').where('user', '==', 'test').limit(1).get();
  if (!results.empty) {
    results.forEach(element => {
      console.log(element.data());
    });
  }
};

const generateFirestoreClient = async () => {
  const encodedKey = process.env.FIRESTORE_CREDENTIALS;
  if (!encodedKey) { throw new Error('The $FIRESTORE_CREDENTIALS environment variable was not found!'); }
  const decodedKey = Buffer.from(encodedKey, 'base64').toString();
  const keys = JSON.parse(decodedKey);
  const authClient = auth.fromJSON(keys);
  authClient.scopes = ['https://www.googleapis.com/auth/cloud-platform'];
  const cred = await authClient.authorize();
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: keys.project_id,
      clientEmail: keys.client_email,
      privateKey: keys.private_key
    }),
    databaseURL: process.env.DATABASE_URL
  });
  const authorizedFirestore = admin.firestore();
  authorizedFirestore.settings({ ignoreUndefinedProperties: true });
  await connectionTest(authorizedFirestore);
  return authorizedFirestore;
};

module.exports = async () => {
  const firestore = !admin.apps.length ? await generateFirestoreClient() : admin.app().firestore();
  return firestore;
};
