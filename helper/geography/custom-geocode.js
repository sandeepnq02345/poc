'use strict';
const { getAccessToken } = require('../validation/oauth2-get-access-token');
const config = require('../../config')();
const { clGeoCodingAPI } = config.api;
const { makeApiCall } = require('../api/api-caller');

/**
* It converts the address in standard format.
* @param {Object} address - address.
* @return {Object} - address line, city and zip code.
*/
const standardizeAddress = async (address) => {
  const { token } = await getAccessToken();
  const result = await makeApiCall({
    method: 'GET',
    url: `${clGeoCodingAPI}`,
    params: {
      address
    },
    headers: {
      Authorization: `Bearer ${token}`
    }
  }, 'CL Geocoding');
  return {
    addressLine: result && result.data && result.data.addressLine1,
    city: result && result.data && result.data.city,
    zipcode: result && result.data && result.data.zip
  };
};

module.exports = { standardizeAddress };
