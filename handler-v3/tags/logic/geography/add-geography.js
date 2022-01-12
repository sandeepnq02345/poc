'use strict';

const { preprocessGeography } = require('../../../../helper/processing/pre-post-process-geo');
const { setResponse } = require('../../../../helper/setResponse');
const { retryResponseHandler, clearRetryHandlerCount } = require('../../../../helper/validation/invalid-input');
const { populateState } = require('../../../../helper/geography/populate-state');

const _ = require('lodash');
const { processGeographyString } = require('../../../../helper/processing/process-geography-response');

/**
 * Add Geography controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */
const addGeography = async (df, sessionInfo) => {
  const previousGeography = _.cloneDeep(sessionInfo.geography);
  const currentGeography = _.cloneDeep(sessionInfo['add_location']);

  if ((!currentGeography || _.isEmpty(currentGeography)) && (!previousGeography || _.isEmpty(previousGeography))) {
    retryResponseHandler(df);
    df.setParameter('user_actions', null);
    return;
  }

  sessionInfo.location = _.cloneDeep(currentGeography);
  sessionInfo = await preprocessGeography(sessionInfo);
  const updateResult = updateConfirmedGeo(df, sessionInfo, previousGeography.location, sessionInfo.geography.location);
  if (!updateResult) {
    return;
  }
  sessionInfo = updateResult;
  sessionInfo.userCurrentState = await populateState(sessionInfo);
  sessionInfo.currentZipAndRegions = [];
  df.setParameter('currentZipAndRegions', null);
  const geoString = processGeographyString(sessionInfo.userCurrentState);
  setResponse(df, 'modifyGeographySuccess', { propertiesCount: Math.floor(Math.random() * 1000) + 1, geoString: geoString });
  clearRetryHandlerCount(df);
  df.setParameter('userCurrentState', sessionInfo.userCurrentState);
};

const updateConfirmedGeo = (df, sessionInfo, prevGeo, currentGeo) => {
  sessionInfo = _.cloneDeep(sessionInfo);
  prevGeo.forEach((geo) => {
    const types = Object.keys(geo);
    types.forEach((type) => {
      if (type !== 'original') {
        const finalParameterLocationType = sessionInfo.userCurrentState.geography[type] || [];
        const index = finalParameterLocationType.indexOf(geo[type]);
        if (index > -1) {
          finalParameterLocationType.splice(index, 1);
        }
        sessionInfo.userCurrentState.geography[type] = finalParameterLocationType;
      }
    });
  });
  currentGeo.forEach((geo) => {
    const types = Object.keys(geo);
    types.forEach((type) => {
      if (type !== 'original') {
        const finalParameterLocationType = sessionInfo.userCurrentState.geography[type] || [];
        const index = finalParameterLocationType.indexOf(geo[type]);
        if (index === -1) {
          finalParameterLocationType.push(geo[type]);
        }
        sessionInfo.userCurrentState.geography[type] = finalParameterLocationType;
      }
    });
  });
  /*
  // Not applicable for liens usecase
  const stateLength = getGeoLength(sessionInfo.userCurrentState.geography, true);
  const otherGeoLength = getGeoLength(sessionInfo.userCurrentState.geography, false);
  if (stateLength === 0 || otherGeoLength === 0) {
    df.setParameter('user_actions', null);
    setResponse(df, 'geoCannotRemove', { name: sessionInfo['given-name'] });
    return;
  }
  */
  df.setParameter('add_location', []);
  df.setParameter('location', null);
  df.setParameter('geography', null);
  df.setParameter('addGeoConfirmation', null);
  df.setParameter('user_actions', null);
  return sessionInfo;
};

/*
const getGeoLength = (currentGeo, isState) => {
  var geoLength = 0;
  for (const geo in currentGeo) {
    if (isState) {
      geoLength += currentGeo.state.length || 0;
      break;
    } else if (geo !== 'state') {
      geoLength += currentGeo[geo].length || 0;
    }
  }
  return geoLength;
};
 */

module.exports = addGeography;
