'use strict';

/**
 * Initial geography controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */
const _ = require('lodash');
const config = require('../../../../config')();
const { sliderDefault, sliderMinMax } = config;

const applyForeclosureLayer = async (df, sessionInfo, filter) => {
  const capturedParameters = _.cloneDeep(filter);
  const transactionType = capturedParameters.transaction_type;
  const predicate = capturedParameters.predicate || 'and';
  let userCurrentState = sessionInfo.userCurrentState || {};
  let result = {
    isValid: true
  };
  if (!userCurrentState.transaction_type || (userCurrentState.transaction_type && !userCurrentState.transaction_type[transactionType])) {
    if (capturedParameters.remove) {
      result.isValid = false;
      result.response = 'invalidRemoveAction';
      result.responseParams = { name: sessionInfo['given-name'] };
      return result;
    }
    userCurrentState = _.merge(userCurrentState, {
      transaction_type: {
        [transactionType]: {
          status: false,
          start: sliderDefault.months.min,
          end: sliderDefault.months.max,
          predicate
        }
      }
    });
  }

  result = await updateForeclosureLayer(df, capturedParameters, userCurrentState, transactionType, sessionInfo, result);
  if (result.isValid) {
    df.setParameter('userCurrentState', result.userCurrentState);
    if (userCurrentState.transaction_type[transactionType]) {
      result.payload = {};
      result.payload[transactionType] = userCurrentState.transaction_type[transactionType];
    }
    return result;
  }
  return result;
};

const updateForeclosureLayer = (df, parameters, userCurrentState, transactionType, sessionInfo, result) => {
  const transactionLayer = userCurrentState.transaction_type[transactionType];
  const predicate = (parameters && parameters.predicate);
  transactionLayer.predicate = predicate || transactionLayer.predicate;
  const durationRange = parameters.duration_range;
  const durationStart = sliderMinMax.months.min;
  const durationEnd = sliderMinMax.months.max;
  const duration = {};
  const resultGetValidDuration = {
    isValid: false,
    response: 'getValidDuration',
    responseParams: { name: sessionInfo['given-name'] }
  };

  if (durationRange) {
    if ((durationRange.end && durationRange.end.unit === 'yr') || (durationRange.value && durationRange.value.unit === 'yr' && durationRange.value.amount !== 1)) {
      return resultGetValidDuration;
    } else if ((durationRange.value && durationRange.value.amount === 1) || (durationRange.end && durationRange.end.amount === 1)) {
      (durationRange.value) ? durationRange.value.unit = 'mo' : durationRange.end.unit = 'mo';
      (durationRange.value) ? durationRange.value.amount = 12 : durationRange.end.amount = 12;
    }
    if (durationRange.value) {
      duration.operator = parameters.operator || 'around';
      duration.value = durationRange.value.amount || durationRange.value;
    } else {
      duration.start = durationRange.start.amount || durationRange.start;
      duration.end = durationRange.end.amount;
    }
  }
  if (duration.value < durationStart || duration.value > durationEnd || duration.start < durationStart || duration.start > durationEnd || duration.end < durationStart || duration.end > durationEnd || (duration.operator === 'less than' && duration.value === durationStart) || (duration.operator === 'greater than' && duration.value === durationEnd) || (duration.start !== undefined && duration.start === duration.end)) {
    return resultGetValidDuration;
  }

  if (!parameters.operator && !parameters.duration_range) {
    if (!parameters.remove) {
      if (transactionLayer.status === false) transactionLayer.status = true;
      else {
        result.isValid = false;
        result.response = 'layerAlreadyApplied';
        result.responseParams = { name: sessionInfo['given-name'] };
        return result;
      }
    } else {
      if (transactionLayer.status === true) {
        transactionLayer.status = false;
        result.isValid = true;
        result.response = 'layerRemoved';
        result.responseParams = { transaction_type: transactionType };
      } else {
        result.isValid = false;
        result.response = 'layerNotActive';
        result.responseParams = { name: sessionInfo['given-name'] };
        return result;
      }
    }
  } else {
    transactionLayer.status = true;
    if (duration.operator) {
      if (!parameters.remove) {
        switchOperator(transactionLayer, duration, durationStart, durationEnd);
      } else {
        if (duration.value) {
          duration.operator = `remove ${duration.operator}`;
          switchOperator(transactionLayer, duration, durationStart, durationEnd);
        } else {
          if (duration.operator === 'greater than') transactionLayer.start = durationStart;
          if (duration.operator === 'less than') transactionLayer.end = durationEnd;
        }
      }
    } else {
      if (!parameters.remove) {
        transactionLayer.start = duration.start;
        transactionLayer.end = duration.end;
      }
    }
  }
  result.userCurrentState = userCurrentState;
  return result;
};

const switchOperator = (transactionLayer, duration, durationStart, durationEnd) => {
  switch (duration.operator) {
    case 'greater than':
      if (duration.value >= transactionLayer.end) {
        transactionLayer.end = durationEnd;
      }
      transactionLayer.start = duration.value || durationStart;
      break;

    case 'less than':
      if (duration.value <= transactionLayer.start) {
        transactionLayer.start = durationStart;
      }
      transactionLayer.end = duration.value;
      break;

    case 'around':
      transactionLayer.start = durationStart;
      transactionLayer.end = duration.value;
      break;

    case 'remove greater than':
      if (duration.value <= transactionLayer.start || duration.value >= transactionLayer.end) {
        transactionLayer.start = durationStart;
      }
      transactionLayer.end = duration.value;
      break;

    case 'remove less than':
      if (duration.value <= transactionLayer.start || duration.value >= transactionLayer.end) {
        transactionLayer.end = durationEnd;
      }
      transactionLayer.start = duration.value;
      break;
  }
};
module.exports = { applyForeclosureLayer };
