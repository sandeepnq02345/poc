'use strict';

// const tokenGenerator = require("./token-generator");

/**
 * Returns request Headers
 */
const getOptions = () => {
  // let token = await tokenGenerator();
  return {
    headers: {
      'Content-Type': 'application/json'
      // "Authorization": `Bearer ${token}`
    },
    json: true
  };
};

const getBasicAuth = (username, password) => {
  const creds = Buffer.from((`${username}:${password}`)).toString('base64');
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${creds}`
    },
    json: true
  };
};

module.exports = {
  getOptions,
  getBasicAuth
};
