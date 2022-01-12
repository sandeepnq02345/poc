'use strict';

const { operations } = require('../../../../helper/modify-operations');
const _ = require('lodash');
const { setInvalidInputCount, clearInvalidInput } = require('../../../../helper/validation/invalid-input');
const { sliderMinMax } = require('../../../../helper/constant');

const modifyEquityLtv = (df, sessionInfo, filter) => {
  const predicate = filter.predicate;
  let range = {};
  const invalidRanges = [];
  const payload = {};
  let invalidQueryResult = false;
  const requestFilter = (filter && filter.filters) || null;
  if (!filter.range) {
    invalidRanges.push(requestFilter);
  } else {
    range = filter.range || null;
    if (!sessionInfo.userCurrentState[requestFilter]) {
      sessionInfo = setDefaultFilterValue(sessionInfo, requestFilter);
    }
    const result = updateRange(df, sessionInfo, range, filter);
    if (!result) {
      invalidQueryResult = true;
      if (sessionInfo.userCurrentState[requestFilter].min === sliderMinMax[requestFilter].min && sessionInfo.userCurrentState[requestFilter].min === sliderMinMax[requestFilter].min) {
        delete sessionInfo.userCurrentState[requestFilter];
      }
      return {
        isValid: false,
        payload
      };
    }
    sessionInfo.userCurrentState[requestFilter].predicate = predicate || sessionInfo.userCurrentState[requestFilter].predicate || 'and';
    sessionInfo.userCurrentState[requestFilter].min = (result.min !== undefined) ? result.min : sessionInfo.userCurrentState[requestFilter].min;
    sessionInfo.userCurrentState[requestFilter].max = (result.max !== undefined) ? result.max : sessionInfo.userCurrentState[requestFilter].max;
    payload[requestFilter] = sessionInfo.userCurrentState[requestFilter];
    df.setParameter('userCurrentState', sessionInfo.userCurrentState);
    df.setParameter('filters', null);
  }
  df.setParameter('operator', null);
  df.setParameter('user_actions', null);
  if (!invalidQueryResult && invalidRanges.length > 0 && areInitialParametersCaptured(sessionInfo)) {
    if (sessionInfo.userCurrentState && !sessionInfo.userCurrentState[requestFilter]) {
      setInvalidInputCount(df, invalidRanges.join(', ').toLowerCase(), 'getRange');
      return {
        isValid: false,
        payload
      };
    } else {
      return {
        isValid: false,
        response: 'criteriaAlreadyApplied',
        responseParams: { name: sessionInfo['given-name'] }
      };
    }
  }
  clearInvalidInput(df, requestFilter);
  return {
    isValid: true,
    payload
  };
};

const areInitialParametersCaptured = (sessionInfo) => {
  return sessionInfo && (sessionInfo['given-name'] || sessionInfo.userCurrentState['given-name']) &&
    (sessionInfo.userCurrentState && !_.isEmpty(sessionInfo.userCurrentState.geography));
};

const setDefaultFilterValue = (sessionInfo, requestFilter) => {
  sessionInfo.userCurrentState[requestFilter] = {
    min: (requestFilter.toLowerCase() === 'property') ? null : 0,
    max: (requestFilter.toLowerCase() === 'property') ? null : 100
  };
  return sessionInfo;
};

const updateRange = (df, sessionInfo, percentageRange, rangeType) => {
  let range = _.cloneDeep(percentageRange);
  const type = rangeType && rangeType.filters && rangeType.filters.toLowerCase();
  if (type && (rangeType.operator === 'less than' || range.operator === 'less than') && range.value === 0) {
    range = null;
    (type !== 'property') ? setInvalidInputCount(df, type, 'getValidRange') : setInvalidInputCount(df, type, 'getValidRangeProperty');
    return range;
  }
  if (type && type !== 'property') {
    if ((range.min !== undefined && range.max !== undefined && (range.min === range.max)) || ((rangeType.operator === 'greater than' || range.operator === 'greater than') && range.value === 100)) {
      range = null;
      setInvalidInputCount(df, type, 'getValidRange');
      return range;
    }
    range.min = range.min && typeof (range.min) === 'string' ? parseInt(range.min.split('%')[0]) : range.min || sessionInfo.userCurrentState[type].min;
    range.max = range.max && typeof (range.max) === 'string' ? parseInt(range.max.split('%')[0]) : range.max || sessionInfo.userCurrentState[type].max;
    range.value = range.value && typeof (range.value) === 'string' ? parseInt(range.value.split('%')[0]) : (range.value === 0) ? 0 : range.value || null;
  }

  if (type === 'property' && ((range.min !== undefined && range.min === range.max) || (range.min < 0) || (range.max <= 0) || (range.original.indexOf('%') > -1 || range.original.indexOf('percent') > -1 || range.original.indexOf('percentage') > -1) || (range.operator === undefined && rangeType.operator === undefined && range.min === undefined && range.max === undefined && range.value === 0))) {
    range = null;
    setInvalidInputCount(df, type, 'getValidRangeProperty');
    return range;
  }
  if ((type !== 'property' && (range.min === range.max || range.min < 0 || range.min > 100 || range.max > 100 || range.max < 0 || range.value > 100 || range.value < 0))) {
    range = null;
    setInvalidInputCount(df, type, 'getValidRange');
    return range;
  }

  if (!rangeType.remove) {
    range.operator = range.operator || rangeType.operator;
    if (range.operator) {
      if (type === 'property' && (range.value && range.value < 1000)) {
        range.value = range.value * 1000;
      } else if (type === 'property' && (range.max && range.min && range.max.toString().length - range.min.toString().length) === 6) {
        range.min = range.min * 1000000;
      } else if (type === 'property' && (range.max && range.min && range.min < 1000)) {
        range.min = range.min * 1000;
      }
      range = operations.withoutCustomerAction[range.operator](range, sessionInfo, rangeType);
    } else {
      if (type === 'property') {
        if ((range.max && range.min && range.max.toString().length - range.min.toString().length) === 6) {
          range.min = range.min * 1000000;
        } else if ((range.max && range.min && range.min < 1000)) {
          range.min = range.min * 1000;
        }
      }
      if (range.max && range.min && range.max < range.min) {
        range.min = range.min + range.max;
        range.max = range.min - range.max;
        range.min = range.min - range.max;
      } else if (range.value !== null) {
        range = operations.withoutCustomerAction.around(range, sessionInfo, rangeType);
      }
    }
  } else {
    if (range.operator) {
      range = operations.withCustomerAction.remove[range.operator](range, sessionInfo, rangeType);
    } else if (rangeType.operator) {
      range = operations.withCustomerAction.remove[rangeType.operator](range, sessionInfo, rangeType);
    }
  }
  return range;
};

module.exports = { modifyEquityLtv };
