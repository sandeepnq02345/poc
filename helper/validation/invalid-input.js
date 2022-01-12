'use strict';
const { setResponse } = require('../setResponse');
const { flowMapper } = require('../constant');
const {
  genericFallbackResponse,
  unguidedFallbackResponse
} = require('../../data/responses');
const invalidRangeResponseTypes = ['property', 'ltv', 'equity', 'propensity', 'risk', 'geo', 'filter'];
const _ = require('lodash');

/**
* It sets the invalid input count.
* @param {Object} df - df object from dialogflow.
* @param {String} invalidType - type of invalid input.
* @param {String} respKey - respKey
*/
const setInvalidInputCount = (df, invalidType, respKey = 'genericInvalidInput') => {
  const sessionParameters = df.getCurrentSessionParameters();
  let invalidInput = {};
  let count = respKey !== 'getRange' ? 1 : null;
  if (!sessionParameters || !sessionParameters.invalidInput || !sessionParameters.invalidInput[invalidType]) {
    invalidInput = _.merge(sessionParameters.invalidInput, {
      [invalidType]: count
    });
  } else {
    count = sessionParameters.invalidInput[invalidType];
    if (respKey !== 'getRange') {
      count = typeof count === 'string' ? parseInt(count) + 1 : count + 1;
    } else {
      count = typeof count === 'string' ? parseInt(count) : count;
    }
    invalidInput = _.merge(sessionParameters.invalidInput, {
      [invalidType]: count
    });
  }
  df.setParameter('invalidInput', invalidInput);
  if (count >= 2) {
    if (invalidType === 'geo') {
      setResponse(df, 'invalidGeographyExtended');
    } else if (invalidType === 'filter') {
      setResponse(df, 'noMatch');
    } else {
      setResponse(df, 'invalidInputExtended');
    }
    invalidInput[invalidType] = 0;
    df.setParameter('addGeoConfirmation', null);
    df.setParameter('invalidInput', invalidInput);
  } else if (invalidRangeResponseTypes.includes(invalidType)) {
    setResponse(df, respKey, { name: sessionParameters['given-name'] || '', filter: invalidType });
  } else {
    setResponse(df, 'genericInvalidInput');
  }
};

/**
* It clears the invalid input count.
* @param {Object} df - df object from dialogflow.
* @param {String} invalidType - type of invalid input.
*/
const clearInvalidInput = (df, invalidType) => {
  const sessionParameters = df.getCurrentSessionParameters();
  let invalidInput = {};
  if (!sessionParameters || !sessionParameters.invalidInput || !sessionParameters.invalidInput[invalidType]) {
    invalidInput = {
      [invalidType]: undefined
    };
  } else {
    invalidInput[invalidType] = undefined;
  }
  df.setParameter('invalidInput', invalidInput);
};

const retryResponseHandler = (df, invalidType = 'generic') => {
  const sessionParameters = df.getCurrentSessionParameters();
  const invalidFilterCount = sessionParameters.invalidFilterCount || {};

  const propertyExists = !_.isUndefined(invalidFilterCount[invalidType]) && !_.isNull(invalidFilterCount[invalidType]);
  invalidFilterCount[invalidType] = (propertyExists) ? invalidFilterCount[invalidType] + 1 : 0;
  invalidFilterCount[invalidType] = (invalidFilterCount[invalidType] > 2) ? 0 : invalidFilterCount[invalidType];
  const fallbackResponse = getFallbackResponse[invalidType](invalidFilterCount[invalidType]);
  df.setParameter('invalidFilterCount', invalidFilterCount);
  if (invalidFilterCount[invalidType] === 2) {
    df.setTargetFlow(flowMapper.failure);
    clearRetryHandlerCount(df);
  }
  df.setResponseText(fallbackResponse);
};

const getFallbackResponse = {
  generic: (count) => {
    return genericFallbackResponse.response[count];
  },
  unguided: (count) => {
    return unguidedFallbackResponse.response[count];
  }
};

const clearRetryHandlerCount = (df) => {
  df.setParameter('invalidFilterCount', null);
};

module.exports = { setInvalidInputCount, clearInvalidInput, retryResponseHandler, clearRetryHandlerCount };
