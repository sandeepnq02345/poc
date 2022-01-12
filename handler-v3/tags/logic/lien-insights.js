'use strict';
const _ = require('lodash');
const { setResponse } = require('../../../helper/setResponse');
const { lienTypes: liensArray } = require('../../../models/framework.json').filters.involuntaryLiens;
const { resolveStatistics, submitMultimodalQuery, getPropertiesCount } = require('../../../helper/query-processor-connector');
/**
 * Lien Insights controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */
const recommendLienInsights = async (df, sessionInfo) => {
  // Priority
  // LienCount = 0
  // New Liens > 0
  // Multiple Liens > 0
  // Tax Liens > 0
  // Hoa Liens > 0
  // Mechanics Liens > 0

  const lienType = sessionInfo['lien_type'];
  if (lienType) {
    // TODO: Add logic if user is interested in a specific Lien and return
  }

  const newliensCount = await getPropertiesCount(sessionInfo.queryId, sessionInfo['use_case']);

  if (newliensCount > 0) {
    setLienType(df, liensArray, 'newLienInsight', newliensCount);
  } else {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);
    _.merge(sessionInfo.userCurrentState, {
      lienOrReleaseRecordingDate: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    await submitMultimodalQuery(df, sessionInfo);

    // TODO: Run aggregation api
    const requestBody = {
      bucketAggregations: [
        {
          indexField: 'hmlLienOrReleaseDocumentTypeCode',
          aggregationType: 5,
          parameters: {},
          bucketSize: 250
        }
      ]
    };
    const { bucketAggregation, totalHits } = await resolveStatistics(sessionInfo.queryId, sessionInfo['use_case'], requestBody);
    const { HX: hoaLienCount, MX: mechanicsLienCount, TX: taxLienCount } = bucketAggregation.hmlLienOrReleaseDocumentTypeCode_terms_0;
    const { value: totalLiensCount } = totalHits;
    const liensCountList = [hoaLienCount, mechanicsLienCount, taxLienCount].filter((count) => (!!count));

    if (totalLiensCount === 0) {
      df.setParameter('noLiensFlag', true);
      return;
    }

    if (liensCountList.length > 1) {
      setLienType(df, liensArray, 'multipleLienInsight', totalLiensCount);
    } else if (taxLienCount > 0) {
      setLienType(df, ['tax'], 'taxLienInsight', taxLienCount);
    } else if (hoaLienCount > 0) {
      setLienType(df, ['hoa'], 'hoaLienInsight', hoaLienCount);
    } else if (mechanicsLienCount > 0) {
      setLienType(df, ['mechanics'], 'mechanicsLienInsight', mechanicsLienCount);
    }
  }
};

/**
 * Set LienType in stateParams and provides insight Response
 *
 * @param {object} df webhook fulfillment object
 * @param {array} lienType
 * @param {string} responseKey Response Key
 * @param {number} lienCount Liens Count
 */
const setLienType = (df, lienType, responseKey, lienCount) => {
  const userCurrentState = df.getStateParams();
  _.merge(userCurrentState, {
    lienOrReleaseType: { lienType: [...lienType] }
  });
  setResponse(df, responseKey, { lienCount });
};

module.exports = recommendLienInsights;
