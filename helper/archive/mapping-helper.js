'use strict';

const riskMapping = {
  'VERY LOW': {
    min: 0,
    max: 10
  },
  LOW: {
    min: 11,
    max: 20
  },
  MODERATE: {
    min: 21,
    max: 40
  },
  HIGH: {
    min: 41,
    max: 60
  },
  'VERY HIGH': {
    min: 61,
    max: 80
  },
  EXTREME: {
    min: 81,
    max: 100
  },
  DEFAULT: {
    min: 75,
    max: 100
  }
};

const propensityMapping = {
  'VERY LOW': {
    min: 1,
    max: 370
  },
  LOW: {
    min: 371,
    max: 480
  },
  MODERATE: {
    min: 481,
    max: 600
  },
  HIGH: {
    min: 601,
    max: 795
  },
  'VERY HIGH': {
    min: 796,
    max: 999
  },
  DEFAULT: {
    min: 500,
    max: 599
  }
};

const setMappingRange = (mapping, userCurrentState) => {
  userCurrentState.propensity.min = propensityMapping[mapping].min;
  userCurrentState.propensity.max = propensityMapping[mapping].max;
  return userCurrentState;
};

const updateMappingRange = (range, userCurrentState) => {
  for (const mappingValues in propensityMapping) {
    if (propensityMapping[mappingValues].min <= range.value && range.value <= propensityMapping[mappingValues].max) {
      return setMappingRange(mappingValues.toUpperCase(), userCurrentState);
    }
  }
};

const setMappingRiskRange = (mapping, userCurrentState, riskType) => {
  const result = userCurrentState;
  result.risk[riskType].min = riskMapping[mapping].min;
  result.risk[riskType].max = riskMapping[mapping].max;
  return result;
};

const updateMappingRiskRange = (parameters, userCurrentState, riskType) => {
  for (const mappingValues in riskMapping) {
    if (riskMapping[mappingValues].min <= parameters.range.value && parameters.range.value <= riskMapping[mappingValues].max) {
      const result = setMappingRiskRange(mappingValues.toUpperCase(), userCurrentState, riskType);
      return result;
    }
  }
};

module.exports = { setMappingRange, updateMappingRange, setMappingRiskRange, updateMappingRiskRange, riskMapping, propensityMapping };
