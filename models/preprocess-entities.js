/* eslint-disable camelcase */
'use strict';

const config = require('../config')();
const { filterNameMap } = require('./df-filter-mapping');
const jsonConfig = require('./framework.json');
const _ = require('lodash');
const { wordsPreventingRemoval } = config;
const liensArray = jsonConfig.filters.involuntaryLiens.capturedLienTypes;

const preProcessParams = (df, capturedFilters) => {
  const clonedCapturedFilters = _.cloneDeep(capturedFilters);
  const isUnguided = !!(clonedCapturedFilters.length > 1);
  const modifiedCapturedFilters = (isUnguided) ? processRemoval(df, clonedCapturedFilters) : clonedCapturedFilters;
  const result = modifiedCapturedFilters.map((filterDetails) => {
    filterDetails.filters_combination.isUnguided = isUnguided;
    filterDetails.filters_combination.predicate = filterDetails.predicate || 'and';
    return processFilters(filterDetails.filters_combination);
  });

  return _.flatten(result);
};

const processRemoval = (df, modifyFilters) => {
  // Remove functionality: Multiple filters at the same time
  let filtersToBeRemoved = [];
  filtersToBeRemoved = modifyFilters.filter((filter) => filter.filters_combination.remove);
  if (!_.isEmpty(filtersToBeRemoved)) {
    const userUtterance = df.getUserUtterance();
    if (!wordsPreventingRemoval.some((word) => userUtterance.includes(word))) {
      modifyFilters.map((filter) => { filter.filters_combination.remove = 'remove'; });
    }
  }
  return modifyFilters;
};

const processFilters = (filterDetails) => {
  let processedFilters = {};

  const { filterName, filterSchema } = setFilterName(filterDetails);

  // Sets HIGH LOW MEDIUM Mapping
  if (filterDetails.mapping) {
    filterDetails.range = getMappingRange(filterName, filterDetails.mapping.toUpperCase());
    delete filterDetails.mapping; // required?
  }

  // Handling unguided (having both date and range) peril statements
  if (filterDetails.date_range && filterDetails.range) {
    const perilRange = _.cloneDeep(filterDetails);
    delete perilRange.date_range;
    delete filterDetails.range;
    return [processFilters(filterDetails), processFilters(perilRange)];
  }

  // Check if amount is captured in unit-currency entity
  if (filterDetails.currency_value) {
    filterDetails.range = {
      value: filterDetails.currency_value.amount
    };
    delete filterDetails.currency_value;
  } else if (filterDetails.currency_min) {
    filterDetails.range = {
      min: filterDetails.currency_min.amount,
      max: filterDetails.currency_max.amount
    };
    delete filterDetails.currency_min;
    delete filterDetails.currency_max;
  }

  // Sets Operator and Range Min Max swapping and preprocessing
  let range = filterDetails.range;
  if (range) {
    if (['propertyValue', 'lienAmount'].includes(filterName)) {
      range = processValueRange(range);
    }
    // Evaluating Operator
    if (range.min && range.max) {
      filterDetails.operator = 'between';
      if (range.min > range.max) {
        [range.min, range.max] = [range.max, range.min];
      }
    } else if (range.operator) {
      filterDetails.operator = range.operator;
      delete range.operator;
    } else if (range.value && !filterDetails.operator) {
      filterDetails.operator = 'around';
    }
  }

  // Date checks
  if (filterDetails.date_range) {
    // transform date_range in required format.
    let dateRange = filterDetails.date_range.date_period ? convertToDate(filterDetails.date_range.date_period, filterDetails.date_range.operator) : null;
    if (filterDetails.date_range.date) {
      dateRange = processDate(filterDetails.date_range.date, filterDetails.date_range.operator);
    } else if (filterDetails.date_range.startDate) {
      filterDetails.date_range.date_period = {
        startDate: filterDetails.date_range.startDate,
        endDate: filterDetails.date_range.endDate
      };
      delete filterDetails.date_range.startDate;
      delete filterDetails.date_range.endDate;
      dateRange = convertToDate(filterDetails.date_range.date_period, filterDetails.date_range.operator);
    }
    filterDetails.operator = filterDetails.date_range.operator;
    filterDetails.date_range = dateRange;
  }

  processedFilters = {
    operator: filterDetails.operator,
    range: filterDetails.range,
    action: filterDetails.remove,
    predicate: filterDetails.predicate,
    dateRange: filterDetails.date_range,
    isUnguided: filterDetails.isUnguided,
    filterSchema,
    filterName
  };

  processedFilters = cleanProcessedParams(processedFilters);
  processedFilters = setFilterType(processedFilters);
  processedFilters = setLienType(processedFilters, filterDetails.lien_type);
  return processedFilters;
};

/**
 * Function to remove undefined and original property of the object
 * @param {object} filters
 * @returns Object without undefined and original property
 */
const cleanProcessedParams = (filters) => {
  const processedFilters = _.cloneDeep(filters);
  Object.keys(processedFilters).forEach(key => {
    if (typeof processedFilters[key] === 'object') {
      processedFilters[key] = cleanProcessedParams(processedFilters[key]);
    } else if (processedFilters[key] === undefined || key === 'original') {
      delete processedFilters[key];
    }
  });
  return processedFilters;
};

/**
 * Function to convert date object to JavaScript Date()
 * @param  { startDate, endDate } dateRange
 * @returns Object with converted start and end date
 */
const convertToDate = (dateRange, operator) => {
  const startDate = new Date(dateRange.startDate.year, dateRange.startDate.month - 1, dateRange.startDate.day);
  const endDate = new Date(dateRange.endDate.year, dateRange.endDate.month - 1, dateRange.endDate.day);
  if (startDate > endDate) {
    dateRange = {
      startDate: endDate,
      endDate: startDate
    };
  } else {
    dateRange = {
      startDate: startDate,
      endDate: endDate
    };
  }
  if (operator === 'greater than') {
    dateRange.startDate = endDate;
    dateRange.endDate = new Date();
  } else if (operator === 'less than') {
    dateRange.endDate = startDate;
    delete dateRange.startDate;
  }
  return dateRange;
};

/**
 * Returns the mapping value based on the filterName
 * @param {string} filterName
 * @param {string} mappingValue e.g. LOW, HIGH
 * @returns {Object} { min, max }
 */
const getMappingRange = (filterName, mappingValue) => {
  return jsonConfig.filters[filterName].mappings[mappingValue];
};
/**
 * @param  {object} date single date captured
 * @param  {string} operator
 * @returns {object} dateRange
 */
const processDate = (date, operator) => {
  const todaysDate = new Date();
  const capturedDate = new Date(date.year, date.month - 1, date.day);
  if (operator === 'greater than') {
    return {
      startDate: capturedDate,
      endDate: todaysDate
    };
  }
  return {
    endDate: capturedDate
  };
};

const setFilterName = (filterDetails) => {
  const { filters, layers, date_filter_type, risk_type, recent_sales, lien_type } = filterDetails;
  let filterName = filters || layers || date_filter_type || risk_type || recent_sales || lien_type;
  if (liensArray.includes(filterName)) filterName = 'involuntary';
  return filterNameMap.get(filterName);
};

const setFilterType = (filters) => {
  const filterType = jsonConfig.multiCheckBox.includes(filters.filterSchema) ? 'multiCheckBox'
    : jsonConfig.dateSlider.includes(filters.filterSchema) ? 'dateSlider'
      : jsonConfig.slider.includes(filters.filterSchema) ? 'slider'
        : jsonConfig.checkBox.includes(filters.filterSchema) ? 'checkBox'
          : jsonConfig.filterArray.includes(filters.filterSchema) ? 'involuntary' : 'default';

  filters.filterType = filterType;
  if (filterType === 'slider' || filterType === 'dateSlider') {
    if (jsonConfig.checkBox.includes(filters.filterSchema)) {
      filters.filterType = filters.range ? 'slider' : filters.dateRange ? 'dateSlider' : 'checkBox';
    }
  }
  return filters;
};

const setLienType = (filters, lien_type) => {
  if (filters.filterType === 'involuntary') {
    filters.lienType = (lien_type === 'multiple') ? 'involuntary' : lien_type;
    return filters;
  } else {
    return filters;
  }
};

const processValueRange = (range) => {
  if (range.value && range.value < 1000) {
    range.value = range.value * 1000;
  } else if (range.min && range.min < 1000) {
    range.min = range.min * 1000;
  } else if (range.max && range.max < 1000) {
    range.max = range.max * 1000;
  } else if ((range.max && range.min && range.max.toString().length - range.min.toString().length) === 6) {
    range.min = range.min * 1000000;
  }
  return range;
};

module.exports = { preProcessParams };
