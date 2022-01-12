'use strict';

const { setResponse } = require('../../../../helper/setResponse');
const { preprocessGeography, postProcessGeography } = require('../../../../helper/processing/pre-post-process-geo');
const { processGeographyString } = require('../../../../helper/processing/process-geography-response');
const { setInvalidInputCount, clearInvalidInput } = require('../../../../helper/validation/invalid-input');
const { populateState } = require('../../../../helper/geography/populate-state');
const modifyFilters = require('../modify-filters');

/**
 * Initial geography controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */

const initialGeography = async (df, sessionInfo) => {
  if ((!sessionInfo.location || (sessionInfo.location && !sessionInfo.location.length))) {
    setInvalidInputCount(df, 'geo', 'invalidGeography');
    df.setParameter('user_actions', null);
    return;
  }
  sessionInfo = await preprocessGeography(sessionInfo);
  let userCurrentState = sessionInfo.userCurrentState || {};
  userCurrentState.name = sessionInfo['user_name'] || '';
  userCurrentState.customer_options = sessionInfo.customer_options || 'seller leads';
  sessionInfo.userCurrentState = userCurrentState;
  sessionInfo = postProcessGeography(sessionInfo);
  userCurrentState = sessionInfo.userCurrentState;
  userCurrentState = await populateState(sessionInfo);
  df.setParameter('currentZipAndRegions', null);
  df.setParameter('userCurrentState', userCurrentState);
  const isGeographyCaptured = !!hasInitialGeo(userCurrentState.geography);
  const isStateCaptured = !!(userCurrentState.geography && userCurrentState.geography.state && userCurrentState.geography.state.length > 0);
  if (isGeographyCaptured && isStateCaptured && sessionInfo && sessionInfo.captured_filters && sessionInfo.captured_filters.length) {
    await modifyFilters(df, sessionInfo);
  }
  if (isGeographyCaptured && isStateCaptured) {
    const geographyString = processGeographyString(sessionInfo.userCurrentState);
    setResponse(df, 'initialGeography', { propertiesCount: Math.floor(Math.random() * 1000) + 1, geo: geographyString });
  } else if (!isGeographyCaptured && isStateCaptured) {
    setResponse(df, 'getInitialGeography');
  } else if (isGeographyCaptured && !isStateCaptured) {
    setResponse(df, 'getInitialState');
  } else {
    setInvalidInputCount(df, 'geo', 'invalidGeography');
    df.setParameter('user_actions', null);
    return;
  }
  df.setParameter('isGeographyCaptured', isGeographyCaptured);
  df.setParameter('isStateCaptured', isStateCaptured);
  df.setParameter('geography', null);
  df.setParameter('user_actions', null);
  df.setParameter('location', null);
  clearInvalidInput(df, 'geo');
};

const hasInitialGeo = (geography) => geography && ((geography.city && geography.city.length > 0) || (geography.county && geography.county.length > 0) || (geography.zipcode && geography.zipcode.length > 0) || (geography.region && geography.region.length > 0));

module.exports = initialGeography;
