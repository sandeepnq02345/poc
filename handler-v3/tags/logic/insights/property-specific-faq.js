'use strict';

const config = require('../../../../config')();
const { setResponse } = require('../../../../helper/setResponse');
const { years, regexHashtag } = config;
const { standardizeAddress } = require('../../../../helper/geography/custom-geocode');

/**
 * View specific property controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */

const propertySpecificFAQ = async (df, sessionInfo) => {
  const year = years[Math.floor(Math.random() * years.length)];
  let userCurrentState = sessionInfo.userCurrentState || {};
  let address = sessionInfo.address;
  if (address) {
    address = address.replace(regexHashtag, '#');
    const { addressLine, city, zipcode } = await standardizeAddress(address);
    if (addressLine && city && zipcode) {
      userCurrentState.property_name = addressLine;
      userCurrentState.property_city = city;
      userCurrentState.property_zipcode = zipcode;
    } else {
      userCurrentState = removeInsightPropertyDetails(userCurrentState);
    }
  }

  if (!userCurrentState.property_name || (!userCurrentState.property_city && !userCurrentState.property_zipcode)) {
    setResponse(df, 'askPropertyInfo');
    userCurrentState = removeInsightPropertyDetails(userCurrentState);
    df.setParameter('userCurrentState', userCurrentState);
    df.setParameter('address', null);
    return;
  }

  address = userCurrentState.property_name;
  const duration = sessionInfo.duration;

  if (address && duration) {
    setResponse(df, 'propertyValueTrend', {
      insightAddress: address,
      insightPropertyValuePeakYear: year,
      insightPropertyValueTrend: `decreased and is ${Math.floor(Math.random() * 20) + 1} of it's value from ${year}`
    });
  } else if (address && !duration) {
    setResponse(df, 'propertySpecificInfo', {
      insightAddress: address,
      insightPropertyValue: Math.floor(Math.random() * (1000 - 500) + 500) + 'K',
      insightEquityValue: Math.floor(Math.random() * 100) + 1,
      insightAverageRiskScore: Math.floor(Math.random() * 100) + 1,
      insightDuration: Math.floor(Math.random() * 10) + 1,
      insightPropertyValueTrend: `decreased and is ${Math.floor(Math.random() * 20) + 1} of it's value from ${year}`
    });
  }
  df.setParameter('duration', null);
  df.setParameter('address', null);
  df.setParameter('userCurrentState', userCurrentState);
};

const removeInsightPropertyDetails = (userCurrentState) => {
  delete userCurrentState.property_name;
  delete userCurrentState.property_city;
  delete userCurrentState.property_zipcode;
  return userCurrentState;
};

module.exports = propertySpecificFAQ;
