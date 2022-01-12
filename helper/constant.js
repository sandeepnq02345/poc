'use strict';

module.exports = {
  filters: ['equity', 'LTV'],
  risks: ['scs', 'composite'],
  acronyms: ['scs'],
  years: ['2010', '2011', '2012', '2013', '2014', '2015', '2017', '2018', '2019', '2020'],
  stateParams: ['geography', 'propensity', 'property', 'equity', 'ltv', 'risk', 'recent_sales', 'transaction_type'],
  propensityIntentsFAQ: ['faq.propensity.scores', 'faq.propensity'],
  wordsPreventingRemoval: ['show', 'add', 'view', 'modify', 'change', 'update', 'see', 'adjust'],
  retainSessionInfo: ['hasStartOver', 'user_name', 'industry_type', 'lastLoginDate', 'hasElseIndustry'],
  regexHashtag: /(hashtag )|(hash )|(hashtag)|(hash)/gi,
  statisticsMapper: {
    propertyCount: 'propertiesCount',
    minPropertyValue: 'minPropertyValue',
    maxPropertyValue: 'maxPropertyValue',
    medianPropertyValue: 'medianPropertyValue',
    averageRiskScore: 'averageRiskScore',
    insightPropertyValue: 'insightPropertyValue',
    insightEquityValue: 'insightEquityValue',
    insightAverageRiskScore: 'insightAverageRiskScore',
    insightPropertyValuePeakYear: 'insightPropertyValuePeakYear',
    insightPropertyValueTrend: 'insightPropertyValueTrend'
  },
  flowMapper: {
    sellerLeads: 'db38fa1d-a726-4878-a12d-968a1cd4c4de',
    involuntaryLiens: '482a031b-eb09-4cba-a38b-2af1d8648849',
    hazards: '1bdf3432-b5e7-4e7a-b650-04764d5dc885',
    failure: 'fce59b73-68a5-4010-b09b-99d0070ec0db'
  },
  preventPropertyRemovalTags: ['property-specific-faq'],
  ignorePropertyCheckTags: ['select_usecase', 'lien_insights'],
  ignoreBuildTags: ['lien_insights'],
  excludedStateCodes: ['oh', 'me', 'hi', 'in'],
  acknowledgePrefix: ['Sure', 'Okay', 'Sounds good', 'Got it', 'Right', 'On it', 'Awesome', 'Perfect', 'All right'],
  superLien: ['AL', 'AK', 'CO', 'CT', 'DE', 'DC', 'FL', 'HI', 'IL', 'LA', 'MD', 'MA', 'MN', 'NV', 'NH', 'NJ', 'OR', 'PA', 'RI', 'TN', 'VT', 'WA', 'WV'],
  judicialLien: ['CT', 'DE', 'FL', 'HI', 'IL', 'IN', 'IA', 'KS', 'LA', 'ME', 'NJ', 'NM', 'NY', 'ND', 'OH', 'OK', 'PA', 'SC', 'VT', 'WI'],
  nonSuperLien: ['AZ', 'AR', 'CA', 'GA', 'ID', 'IN', 'IA', 'KS', 'KY', 'ME', 'MI', 'MS', 'MO', 'MT', 'NE', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'SC', 'SD', 'TX', 'UT', 'VA', 'WI', 'WY'],
  nonJudicialLien: ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'DC', 'GA', 'ID', 'KY', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NC', 'OR', 'RI', 'SD', 'TN', 'TX', 'UT', 'VA', 'WA', 'WV', 'WY']
};
