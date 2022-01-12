'use strict';
const { makeApiCall } = require('../api/api-caller');
const config = require('../../config')();
const { geoCodingAPI } = config.api;
const logger = require('../../lib/logger');

/**
* Used to get the code of the state.
* @param {String} stateName - name of the state.
* @return {String} - first element of stateObject.
*/
const getStateCode = async (stateName) => {
  const response = await getAPIResult(stateName);
  const results = (response && response.data && response.data.results) || [];
  for (const result of results) {
    const addressComponents = result.address_components;
    const stateObject = addressComponents.filter((component) => component.types && component.types.includes('administrative_area_level_1'));
    return (stateObject[0] && stateObject[0].short_name);
  }
  logger.log('info', `Unable to find state code for ${stateName}`);
  return null;
};

/**
* Used to get name of the state.
* @param {String} stateName - name of the state.
* @return {Object} - code and name of state.
*/
const getStateName = async (address) => {
  const response = await getAPIResult(address);
  const results = (response && response.data && response.data.results) || [];
  for (const result of results) {
    const addressComponents = result.address_components;
    const stateObject = addressComponents.filter((component) => component.types && component.types.includes('administrative_area_level_1'));
    return {
      code: (stateObject[0] && stateObject[0].short_name),
      name: (stateObject[0] && stateObject[0].long_name)
    };
  }
  logger.log('info', `Unable to find state for ${address}`);
  return null;
};

/**
* It resolves city and zip code for a state.
* @param {Object} address - address.
* @return {Object} - postal code and city of a state.
*/
const resolveCityAndZipcode = async (address) => {
  const response = await getAPIResult(address);
  const results = (response && response.data && response.data.results) || [];
  for (const result of results) {
    const addressComponents = result.address_components;
    return addressComponents.reduce((acc, cur) => {
      if (cur.types.includes('locality')) {
        acc.city = cur.long_name;
      }
      if (cur.types.includes('postal_code')) {
        acc.postalCode = cur.long_name;
      }
      return acc;
    }, { postalCode: null, city: null });
  }
  logger.log('info', `Unable to resolve city and zipcode for ${address}`);
  return { postalCode: null, city: null };
};

/**
* It fetches the API result.
* @param {Object} address - address.
* @return {Object} - API response.
*/
const getAPIResult = async (address) => {
  address = (address && address.toLowerCase()) || '';
  if (!address) {
    return address;
  }
  const response = await makeApiCall({
    method: 'get',
    url: geoCodingAPI,
    params: {
      address: address,
      key: process.env.GEOCODING_API_KEY
    }
  }, 'Geocoding');
  return response;
};

module.exports = { getStateCode, getStateName, resolveCityAndZipcode };
