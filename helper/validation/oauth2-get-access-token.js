'use strict';
const { makeApiCall } = require('../api/api-caller');
var qs = require('qs');

const getAccessToken = async () => {
  const clientId = process.env.INTERNAL_CLIENT_ID;
  const clientSecret = process.env.INTERNAL_CLIENT_SECRET;
  const accessToken = process.env.ACCESS_TOKEN;
  const expiryTime = process.env.TOKEN_EXPIRY;
  const currentDate = new Date().getTime();
  if (accessToken && currentDate < expiryTime) {
    console.log('Using same token');
    return { token: accessToken, expiry: expiryTime };
  }
  const data = qs.stringify({
    grant_type: 'client_credentials',
    scope: '',
    client_id: clientId,
    client_secret: clientSecret
  });
  const options = {
    method: 'POST',
    url: process.env.INTERNAL_GET_TOKEN_URL,
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    data: data
  };
  let result = null;
  try {
    result = await makeApiCall(options, 'GET TOKEN');
    const accessToken = result && result.data && result.data.access_token;
    const expiresIn = result && result.data && result.data.expires_in;
    const expiryDate = new Date();
    const currentTime = expiryDate.getTime();
    const expiryTime = currentTime + 1000 * expiresIn;
    process.env.ACCESS_TOKEN = accessToken;
    process.env.TOKEN_EXPIRY = expiryTime;
    return { token: accessToken, expiry: expiryTime };
  } catch (error) {
    throw new Error('Error in generating access token');
  }
};

module.exports = { getAccessToken };
