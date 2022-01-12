const config = require('../../../../config')();
const { preprocessGeography, postProcessGeography } = require('../../../../helper/processing/pre-post-process-geo');
const { setInvalidInputCount, clearInvalidInput } = require('../../../../helper/validation/invalid-input');
const { populateState } = require('../../../../helper/geography/populate-state');
const { standardizeAddress } = require('../../../../helper/geography/custom-geocode');
const { years, regexHashtag } = config;
const { setResponse } = require('../../../../helper/setResponse');
const { sliderDefault } = config;

/**
 * Initial geography controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */

const propertySpecificComparables = async (df, sessionInfo) => {
  if ((!sessionInfo.location || (sessionInfo.location && !sessionInfo.location.length))) {
    setInvalidInputCount(df, 'geo', 'invalidGeography');
    df.setParameter('user_actions', null);
    return;
  }
  sessionInfo = await preprocessGeography(sessionInfo);
  let userCurrentState = sessionInfo.userCurrentState || {};
  userCurrentState.name = sessionInfo['given-name'] || '';
  userCurrentState.customer_options = sessionInfo.customer_options || 'seller leads';
  userCurrentState.propensity = {
    min: sliderDefault.propensity.min,
    max: sliderDefault.propensity.max
  };
  let address = sessionInfo.address;
  sessionInfo.userCurrentState = userCurrentState;
  sessionInfo = postProcessGeography(sessionInfo);
  userCurrentState = sessionInfo.userCurrentState;
  if (sessionInfo.property_state) {
    userCurrentState.geography.state = [sessionInfo.property_state];
  } else {
    userCurrentState = await populateState(sessionInfo);
  }
  const isGeographyCaptured = !!hasInitialGeo(userCurrentState.geography);
  const isStateCaptured = !!(userCurrentState.geography && userCurrentState.geography.state && userCurrentState.geography.state.length > 0);

  if (sessionInfo.property_name) {
    userCurrentState.property_name = sessionInfo.property_name;
    userCurrentState.property_city = sessionInfo.property_city;
    userCurrentState.property_zipcode = sessionInfo.property_zipcode;
    userCurrentState.property_clip = sessionInfo.property_clip;
    userCurrentState.property_state = sessionInfo.property_state;
    userCurrentState.queryBehavior = 'singlePropertyComparables';
  } else if (address) {
    address = address.replace(regexHashtag, '#');
    const { addressLine, city, zipcode } = await standardizeAddress(address);
    if (addressLine && city && zipcode) {
      userCurrentState.property_name = addressLine;
      userCurrentState.property_city = city;
      userCurrentState.property_zipcode = zipcode;
      userCurrentState.property_clip = sessionInfo.property_clip;
      userCurrentState.property_state = sessionInfo.property_state;
      userCurrentState.queryBehavior = 'singlePropertyComparables';
    } else {
      userCurrentState = removeInsightPropertyDetails(userCurrentState);
    }
  }

  const isPropertyNameCaptured = !!hasPropertyName(userCurrentState);
  const isPropertyZipcodeCaptured = !!hasPropertyZip(userCurrentState);
  const isPropertyCityCaptured = !!hasPropertyCity(userCurrentState);
  const year = years[Math.floor(Math.random() * years.length)];
  if ((!isPropertyNameCaptured) || (!isPropertyZipcodeCaptured)) {
    userCurrentState = removeInsightPropertyDetails(userCurrentState);
    df.setParameter('userCurrentState', userCurrentState);
    df.setParameter('address', null);
    return;
  } else if (isPropertyNameCaptured && isPropertyZipcodeCaptured && isPropertyCityCaptured) {
    setResponse(df, 'propertySpecificInfo', {
      insightAddress: address,
      insightPropertyValue: Math.floor(Math.random() * (1000 - 500) + 500) + 'K',
      insightEquityValue: Math.floor(Math.random() * 100) + 1,
      insightAverageRiskScore: Math.floor(Math.random() * 100) + 1,
      insightDuration: Math.floor(Math.random() * 10) + 1,
      insightPropertyValueTrend: `decreased and is ${Math.floor(Math.random() * 20) + 1} of it's value from ${year}`
    });
  }
  clearInvalidInput(df, 'geo');

  df.setParameter('isGeographyCaptured', isGeographyCaptured);
  df.setParameter('isStateCaptured', isStateCaptured);
  df.setParameter('geography', null);
  df.setParameter('user_actions', null);
  df.setParameter('location', []);
  df.setParameter('duration', null);
  df.setParameter('address', null);
  df.setParameter('userCurrentState', userCurrentState);
};

const hasInitialGeo = (geography) => geography && ((geography.city && geography.city.length > 0) || (geography.county && geography.county.length > 0) || (geography.zipcode && geography.zipcode.length > 0) || (geography.region && geography.region.length > 0));
const hasPropertyName = (sessionInfo) => (sessionInfo.property_name && sessionInfo.property_name.length > 0);
const hasPropertyZip = (sessionInfo) => (sessionInfo.property_zipcode && sessionInfo.property_zipcode.length > 0);
const hasPropertyCity = (sessionInfo) => (sessionInfo.property_city && sessionInfo.property_city.length > 0);

const removeInsightPropertyDetails = (userCurrentState) => {
  delete userCurrentState.property_name;
  delete userCurrentState.property_city;
  delete userCurrentState.property_zipcode;
  return userCurrentState;
};

module.exports = propertySpecificComparables;
