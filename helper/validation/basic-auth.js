'use strict';

const config = require('../../config')();

/**
 * Authorization (basic auth) for dialogflow fulfillment request
 * @param {object} auth Authorization header
 */
const basicAuth = (auth) => {
  if (!auth) {
    return false;
  }
  const userName = config.services.auth.username;
  const password = config.services.auth.password;

  // eslint-disable-next-line new-cap
  const credentials = new Buffer.from(auth.split(' ').pop(), 'base64')
    .toString('ascii')
    .split(':');
  const isAuthenticated = (credentials[0] === userName && credentials[1] === password);
  return !!(isAuthenticated);
};

module.exports = basicAuth;
