'use strict';

const { GoogleAuth } = require('google-auth-library');
// const logger = require("../lib/logger");
const fs = require('fs');

/**
 * generateToken helper method creates a google oauth token and sets it in environment variable
 */

const generateToken = async () => {
  const authConfig = {
    scopes: 'https://www.googleapis.com/auth/dialogflow',
    credentials: JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf-8'))
  };
  if (process.env.NODE_ENV == null || process.env.NODE_ENV == 'local') { authConfig.credentials = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf-8')); }
  const auth = new GoogleAuth(authConfig);
  await auth.getClient();
  const token = await auth.getAccessToken();
  return token;
};

module.exports = generateToken;
