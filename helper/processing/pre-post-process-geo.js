'use strict';
const _ = require('lodash');
const { getStateCode, getStateName } = require('../geography/get-state-code');
const config = require('../../config')();
const { excludedStateCodes } = config;

/**
 * Used for preprocessing location object captured and convert it to geography object.
 * @param {object} sessionInfo - state parameters object that contains location keys
 * @param {array} sessionInfo.location
 * @returns {object} Returns a sessionInfo object with an additional parameter called geography that contain parsed locations from location object.
 */
const preprocessGeography = async (sessionInfo) => {
  const locationValues = (sessionInfo && sessionInfo.location) || [];
  const stateCaptured = !!locationValues.filter(loc => loc.state).length;
  const location = [];
  for (const _location of locationValues) {
    const locationObj = _.clone(_location);
    if (locationObj && locationObj.city) {
      const { state } = await resolveState(locationObj, stateCaptured);
      if (state) {
        location.push({
          state
        });
      }
    }
    if (locationObj && locationObj.original && excludedStateCodes.includes(locationObj.original.toLowerCase())) {
      continue;
    };
    delete locationObj.original;
    const types = Object.keys(locationObj);
    for (const type of types) {
      const resultLocation = {};
      resultLocation[type] = (type && type.toLowerCase() === 'state') ? await getStateCode(locationObj[type]) : locationObj[type].toLowerCase().replace(/county/g, '').trim().toUpperCase();
      if (resultLocation[type]) {
        location.push(resultLocation);
      }
      if (locationObj && locationObj.county) {
        const { state } = await resolveState(locationObj, stateCaptured);
        if (state) {
          location.push({
            state: state
          });
        }
      }
      if (['zipcode', 'region'].includes((type && type.toLowerCase()))) {
        if (!sessionInfo.currentZipAndRegions) {
          sessionInfo.currentZipAndRegions = [locationObj[type]];
        } else {
          sessionInfo.currentZipAndRegions.push(locationObj[type]);
        }
      }
    };
  };
  sessionInfo.geography = { location: Array.from(new Set(location.map(JSON.stringify))).map(JSON.parse) };
  return sessionInfo;
};

const postProcessGeography = (sessionInfo) => {
  sessionInfo = _.cloneDeep(sessionInfo);
  const locationValues = sessionInfo.geography.location.filter((_location) => !_location.state);
  const stateLocation = sessionInfo.geography.location.reduce((prev, cur) => {
    if (cur.state) {
      prev.state.push(cur.state);
    }
    return prev;
  }, { state: [] });
  if (!locationValues) {
    return sessionInfo;
  }
  if (!sessionInfo.userCurrentState) {
    sessionInfo.userCurrentState = {};
  }
  const resultLocationObject = {};
  locationValues.forEach((_location) => {
    const types = Object.keys(_location);
    types.forEach((type) => {
      if (!resultLocationObject[type]) {
        resultLocationObject[type] = [_location[type]];
      } else {
        resultLocationObject[type].push(_location[type]);
      }
    });
  });
  const currentStates = (sessionInfo.userCurrentState.geography && sessionInfo.userCurrentState.geography.state) || [];
  if (stateLocation && stateLocation.state && stateLocation.state.length === 0) {
    stateLocation.state = currentStates;
  }
  if (sessionInfo && sessionInfo.userCurrentState && sessionInfo.userCurrentState.geography) {
    delete sessionInfo.userCurrentState.geography.state;
  }
  sessionInfo.userCurrentState.geography = locationValues.length > 0 ? resultLocationObject : sessionInfo.userCurrentState.geography;
  sessionInfo.userCurrentState.geography = _.merge(sessionInfo.userCurrentState.geography, stateLocation);
  delete sessionInfo.location;
  return sessionInfo;
};

const resolveState = async (locationObject, stateCaptured) => {
  let originalText = locationObject && (locationObject.original || locationObject.county);
  if (!originalText) {
    return { state: null };
  }
  const state = await getStateName(originalText);
  if (!state || (state && !state.name)) {
    return { state: null };
  }
  const city = (locationObject && locationObject.city && locationObject.city.toLowerCase()) || '';
  originalText = originalText.toLowerCase().replace(city, '');
  if (!stateCaptured || originalText.toLowerCase().includes(state.name.toLowerCase())) {
    return {
      state: state.code
    };
  }
  return { state: null };
};

module.exports = { preprocessGeography, postProcessGeography };
