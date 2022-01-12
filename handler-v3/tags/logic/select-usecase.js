'use strict';
const { setResponse } = require('../../../helper/setResponse');
const { lienTypes: liensArray } = require('../../../models/framework.json').filters.involuntaryLiens;
const { useCaseMapping } = require('../../../models/usecase-mapping');
const { defaultRange: propensityDefaultRange } = require('../../../models/framework.json').filters.propensityToSell;

/**
 * Use Case Selection controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */
const setDefaultUseCaseProperties = async (df, sessionInfo) => {
  const selectedUseCase = useCaseMapping.get(sessionInfo['use_case']);

  if (!selectedUseCase) {
    setResponse(df, 'forceUseCaseSelection');
    return;
  }

  let initialStateParams = {};

  switch (selectedUseCase) {
    case 'involuntaryLiens': {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 1);
      initialStateParams = {
        lienOrReleaseRecordingDate: {
          startDate: sessionInfo.lastLoginDate || startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        lienOrReleaseType: { lienType: liensArray }
      };
      break;
    }
    case 'sellerLeads': {
      initialStateParams = {
        propensity: propensityDefaultRange
      };
      break;
    }
  }
  df.setParameter('userCurrentState', initialStateParams);
};

module.exports = setDefaultUseCaseProperties;
