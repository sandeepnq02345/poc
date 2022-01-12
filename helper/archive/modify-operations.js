'use strict';
const config = require('../../config')();
const { sliderMinMax } = config;
const _ = require('lodash');
const { updateMappingRange } = require('./mapping-helper');

const operations = {
  withoutCustomerAction: {
    'greater than': (range, sessionInfo, rangeType) => {
      if (range.value >= sessionInfo.userCurrentState[rangeType.filters].max) {
        range.max = (rangeType.filters && rangeType.filters.toLowerCase() === 'property') ? null : 100;
      }
      range.min = (range.value === 0) ? 0 : range.value || range.min;
      return range;
    },
    'less than': (range, sessionInfo, rangeType) => {
      if (range.value <= sessionInfo.userCurrentState[rangeType.filters].min) {
        range.min = (rangeType.filters && rangeType.filters.toLowerCase() === 'property') ? null : 0;
      }
      range.max = range.value || range.max;
      return range;
    },
    around: (range, sessionInfo, rangeType) => {
      const type = rangeType.filters.toLowerCase();
      const priceValue = rangeType.range && rangeType.range.value;
      const minValue = (priceValue - (priceValue * 0.1)) || range.min;
      const maxValue = (priceValue + (priceValue * 0.1)) || range.max;
      range.min = (rangeType.filters && type === 'property') ? minValue : range.value - 5;
      range.max = (rangeType.filters && type === 'property') ? maxValue : range.value + 5;
      if (range.max > 100 && type !== 'property') {
        range.max = 100;
      } else if (range.min < 0 && type !== 'property') {
        range.min = 0;
      }
      return range;
    }
  },
  withCustomerAction: {
    remove: {
      'greater than': (range, sessionInfo, rangeType) => {
        if (range.value <= sessionInfo.userCurrentState[rangeType.filters].min || range.value >= sessionInfo.userCurrentState[rangeType.filters].max) {
          range.min = (rangeType.filters && rangeType.filters.toLowerCase() === 'property') ? null : 0;
        }
        range.max = range.value || range.max;
        return range;
      },
      'less than': (range, sessionInfo, rangeType) => {
        if (range.value <= sessionInfo.userCurrentState[rangeType.filters].min || range.value >= sessionInfo.userCurrentState[rangeType.filters].max) {
          range.max = (rangeType.filters && rangeType.filters.toLowerCase() === 'property') ? null : 100;
        }
        range.min = range.value || range.min;
        return range;
      }
    }
  }
};

const operationsRisk = {
  withoutCustomerAction: {
    'greater than': (riskRange, sessionData, riskType) => {
      if (sessionData.risk[riskType].min === null || riskRange.value < sessionData.risk[riskType].max) {
        sessionData.risk[riskType].min = riskRange.value || riskRange.min;
      } else {
        sessionData.risk[riskType].min = riskRange.value || riskRange.min;
        sessionData.risk[riskType].max = sliderMinMax.risk.max;
      }
      return sessionData;
    },
    'less than': (riskRange, sessionData, riskType) => {
      if (sessionData.risk[riskType].max === null || riskRange.value > sessionData.risk[riskType].min) {
        sessionData.risk[riskType].max = riskRange.value || riskRange.max;
      } else {
        sessionData.risk[riskType].max = riskRange.value || riskRange.max;
        sessionData.risk[riskType].min = sliderMinMax.risk.min;
      }
      return sessionData;
    },
    around: (riskRange, sessionData, riskType) => {
      sessionData.risk[riskType].min = riskRange.value - 5;
      sessionData.risk[riskType].max = riskRange.value + 5;
      return sessionData;
    }

  },
  withCustomerAction: {
    'greater than': (riskRange, sessionData, riskType) => {
      if (riskRange.value <= sessionData.risk[riskType].min || riskRange.value >= sessionData.risk[riskType].max) {
        sessionData.risk[riskType].min = sliderMinMax.risk.min;
      }
      sessionData.risk[riskType].max = riskRange.value || riskRange.max;
      return sessionData;
    },
    'less than': (riskRange, sessionData, riskType) => {
      if (riskRange.value <= sessionData.risk[riskType].min || riskRange.value >= sessionData.risk[riskType].max) {
        sessionData.risk[riskType].max = sliderMinMax.risk.max;
      }
      sessionData.risk[riskType].min = riskRange.value || riskRange.min;
      return sessionData;
    }

  }
};

const operationsAll = {
  withoutCustomerAction: {
    'greater than': (range, userCurrentState, filter) => {
      if (range.value >= userCurrentState[filter].max) {
        userCurrentState[filter].max = sliderMinMax[filter].max;
      }
      userCurrentState[filter].min = range.value || range.min || 0;
      return userCurrentState;
    },
    'less than': (range, userCurrentState, filter) => {
      if (range.value <= userCurrentState[filter].min) {
        userCurrentState[filter].min = sliderMinMax[filter].min;
      }
      userCurrentState[filter].max = range.value || range.max;
      return userCurrentState;
    },
    around: (range, userCurrentState, filter) => {
      if (filter === 'property') {
        userCurrentState[filter].min = range.value -= range.value * 0.1;
        userCurrentState[filter].max = range.value += range.value * 0.1;
        if (userCurrentState[filter].min < 0) { userCurrentState[filter].min = null; }
      } else if (filter === 'propensity') {
        userCurrentState = updateMappingRange(range, _.cloneDeep(userCurrentState));
      } else {
        userCurrentState[filter].min = range.value - 5;
        userCurrentState[filter].max = range.value + 5;
        if (userCurrentState[filter].min < sliderMinMax[filter].min) { userCurrentState[filter].min = sliderMinMax[filter].min; }
        if (userCurrentState[filter].max > sliderMinMax[filter].max) { userCurrentState[filter].max = sliderMinMax[filter].max; }
      }
      return userCurrentState;
    }
  },
  withCustomerAction: {
    'greater than': (range, userCurrentState, filter) => {
      if (range.value <= userCurrentState[filter].min || range.value >= userCurrentState[filter].max) {
        userCurrentState[filter].min = sliderMinMax[filter].min;
      }
      userCurrentState[filter].max = range.value || range.max;
      return userCurrentState;
    },
    'less than': (range, userCurrentState, filter) => {
      if (range.value <= userCurrentState[filter].min || range.value >= userCurrentState[filter].max) {
        userCurrentState[filter].max = sliderMinMax[filter].max;
      }
      userCurrentState[filter].min = range.value || range.min;
      return userCurrentState;
    }
  }
};

const operationsClearValues = {
  'greater than': (userCurrentState, filter) => {
    if (userCurrentState && userCurrentState[filter] && userCurrentState[filter].min) {
      userCurrentState[filter].min = sliderMinMax[filter].min;
    }
    return userCurrentState;
  },
  'less than': (userCurrentState, filter) => {
    if (userCurrentState && userCurrentState[filter] && userCurrentState[filter].max) {
      userCurrentState[filter].max = sliderMinMax[filter].max;
    }
    return userCurrentState;
  }
};

module.exports = { operations, operationsRisk, operationsClearValues, operationsAll };
