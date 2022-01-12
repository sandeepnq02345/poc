'use strict';

const axios = require('axios');
const logger = require('../../lib/logger');
const shouldNotLogBody = ['Geocoding'];

/**
 * Make External Api call
 * @param {Object} request request object
 * @param {String} apiName Name of the api being called
 * @return {Object} response object
 */
module.exports.makeApiCall = async (request, apiName) => {
  if (request.method === 'POST') {
    request.headers['content-type'] = request.headers['content-type'] || 'application/json';
    request.headers.accept = 'application/json';
  }
  const apiPayloadDetails = {
    apiUrl: request.url,
    headers: request.headers,
    methodType: request.method
  };

  if (request.params) {
    apiPayloadDetails.queryParams = request.params;
  }
  if (request.data) {
    apiPayloadDetails.body = request.data;
  }

  try {
    const startTime = Date.now();
    const response = await axios(request);
    const endTime = Date.now();

    if (response && !shouldNotLogBody.includes(apiName)) {
      apiPayloadDetails.apiResult = response.data;
      apiPayloadDetails.apiExeutionTime = `${(endTime - startTime) / 1000}s`;
    }

    logger.log('debug', `API Payload Info: ${apiName}`, `apiDetails/${apiName}`, apiPayloadDetails);
    return response;
  } catch (error) {
    logger.log('error', `Error while calling ${apiName} api`, 'apiCallError', { request, error });
    return Promise.reject(error);
  }
};
