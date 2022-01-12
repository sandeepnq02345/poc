'use strict';
const { flowMapper } = require('../../../helper/constant');
const { setResponse } = require('../../../helper/setResponse');
const { retryResponseHandler } = require('../../../helper/validation/invalid-input');
const { useCaseMapping } = require('../../../models/usecase-mapping');

/**
 * Use Case Switching controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */
const switchUseCase = async (df, sessionInfo) => {
  let { use_case: useCase } = df.getIntentParameters();

  if (!useCase) {
    retryResponseHandler(df);
    return;
  }
  useCase = useCaseMapping.get(useCase);
  switch (useCase) {
    case 'sellerLeads':
      setResponse(df, 'switchToSellerLeads');
      break;
    case 'involuntaryLiens':
      setResponse(df, 'switchToInvoluntaryLiens');
      break;
    case 'hazard':
      setResponse(df, 'switchToHazards');
      break;
  }
  df.setTargetFlow(flowMapper[useCase]);
};

module.exports = switchUseCase;
