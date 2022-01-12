'use strict';

module.exports = {
  initialGeography: {
    response: ['<%= ackPrefix %>! Here are <%= propertiesCount %> properties in <%= geo %>, labeled with our propensity to list score model, which tells you how likely the property is going to be listed. The score is currently set at a range of 500 to 599. I can send what you see to your sandbox or add or change additional filters. How would you like to proceed?'],
    type: 'success'
  },
  getInitialGeography: {
    response: ['<%= ackPrefix %>, could you also specify a city, zip code, county or a region.'],
    type: 'success'
  },
  getInitialState: {
    response: ['Sorry could you also specify the state.'],
    type: 'success'
  },
  unidentifiedState: {
    response: ['Sorry could you also specify the state.'],
    type: 'success'
  },
  unguidedInitialGeography: {
    response: ['<%= ackPrefix %>! Here are <%= propertiesCount %> properties in that area that meet your criteria and also labeled with our propensity to list score model, which tells you how likely the property is going to be listed. The score is currently set at a range of <%= minPropensity %> to <%= maxPropensity %>. I can send what you see to your sandbox or add or change additional filters. How would you like to proceed?'],
    type: 'success'
  },
  firstPropertyValueRange: {
    response: ['<%= ackPrefix %>, here\'s <%= propertiesCount %> properties worth between <%= minPropertyValue %> and <%= maxPropertyValue %>. The median property value is <%= medianPropertyValue %>. What would you like to do next?'],
    type: 'success'
  },
  firstPropertyValueGt: {
    response: ['<%= ackPrefix %>, there are <%= propertiesCount %> properties worth more than <%= minPropertyValue %>. The median property value is <%= medianPropertyValue %>. What would you like to do next?'],
    type: 'success'
  },
  firstPropertyValueLt: {
    response: ['<%= ackPrefix %>, there are <%= propertiesCount %> properties worth less than <%= maxPropertyValue %>. The median property value is <%= medianPropertyValue %>. What would you like to do next?'],
    type: 'success'
  },
  modifiedGeography: {
    response: [
      '<%= ackPrefix %>. That brings the amount of properties to <%= propertiesCount %> in the area.',
      '<%= ackPrefix %>, that changes our property count to <%= propertiesCount %> that fit your criteria.',
      '<%= ackPrefix %>, with that change, <%= propertiesCount %> properties fit your criteria.',
      '<%= ackPrefix %>, that brings the total count to <%= propertiesCount %>.',
      'That\'s done. We now have <%= propertiesCount %> properties.',
      '<%= ackPrefix %>, with that, there are <%= propertiesCount %> properties that fit your criteria.'
    ],
    type: 'success'
  },
  confirmGeographyToAdd: {
    response: ['<%= ackPrefix %>! Which ones would you like added?'],
    type: 'confirmation'
  },
  invalidGeography: {
    response: ['I can\'t seem to find that area. Could you please mention a city name, county or a zipcode instead.'],
    type: 'error'
  },
  invalidGeographyExtended: {
    response: ['Please make sure you are giving me a five digit zip code. If you are interested in other areas, tell me or select them on the map.'],
    type: 'error'
  },
  geoCannotRemove: {
    response: ['Hey <%= name %>, you are trying to remove the initial geography. I can help you with seller leads in other regions as well. You can tell me a city, county or a zip code.'],
    type: 'error'
  },
  geoNotInList: {
    response: ['I\'m sorry, this area doesn\'t seem to have been added before. What would you like to do next?'],
    type: 'error'
  },
  geoAlreadyInList: {
    response: ['It seems that we are already displaying that area. Is there anything else that you would like to add or modify?'],
    type: 'error'
  },
  modifyFilters: {
    response: [
      '<%= ackPrefix %>. That brings the amount of properties to <%= propertiesCount %> in the area.',
      '<%= ackPrefix %>, that changes our property count to <%= propertiesCount %> that fit your criteria.',
      '<%= ackPrefix %>, with that change, <%= propertiesCount %> properties fit your criteria.',
      '<%= ackPrefix %>, that brings the total count to <%= propertiesCount %>.',
      'That\'s done. We now have <%= propertiesCount %> properties.',
      '<%= ackPrefix %>, with that, there are <%= propertiesCount %> properties that fit your criteria.'
    ],
    type: 'success'
  },
  riskLayerUpdated: {
    response: ['<%= ackPrefix %>. The average <%= risk %> risk score for the displayed properties is <%= averageRiskScore %>. What would you like to do next?'],
    type: 'success'
  },
  riskLayerUpdatedRandom: {
    response: ['<%= ackPrefix %>. The average <%= risk %> risk score for the displayed properties is <%= averageRiskScore %>.',
      '<%= ackPrefix %>, The average <%= risk %> risk score for the displayed properties is <%= averageRiskScore %>.'],
    type: 'success'
  },
  criteriaAlreadyApplied: {
    response: ['This criteria seems to have been already applied. What else would you like to do?'],
    type: 'error'
  },
  layerNotActive: {
    response: ['All layers are currently off. What filters or layers would you like to add?'],
    type: 'error'
  },
  recentSalesModified: {
    response: ['<%= ackPrefix %>! I\'ve added the recent sales on the map. What else would you like to see?'],
    type: 'success'
  },
  recentSalesRemoved: {
    response: ['Of course. Recent sales have been removed.'],
    type: 'success'
  },
  layerAlreadyApplied: {
    response: ['This criteria seems to have been already applied. What else would you like to do?'],
    type: 'error'
  },
  layerRemoved: {
    response: ['Sure, I\'ve removed the <%= transaction_type %> layer.'],
    type: 'success'
  },
  getValidDuration: {
    response: ['Sorry, I can only handle months in between 1 and 12.'],
    type: 'error'
  },
  noRiskMentioned: {
    response: ['Which risk layer would you like to add or remove?'],
    type: 'error'
  },
  multipleRisks: {
    response: ['Sorry, I can only handle one risk layer at a time. Which would you like to add first?'],
    type: 'error'
  },
  getValidRiskRange: {
    response: ['That sounds like an invalid value to me. Please provide a value or range between 0 and 100.'],
    type: 'error'
  },
  getValidPropensityRange: {
    response: ['That sounds like an invalid value to me. Please provide a value or range between 1 and 999.'],
    type: 'error'
  },
  getRange: {
    response: ['Sure thing. Let me know which ranges would you like displayed.'],
    type: 'confirmation'
  },
  invalidInputInitial: {
    response: ['Hey <%= name %>, what was it again?'],
    type: 'error'
  },
  noMatch: {
    response: ['I can add or change geographical areas using a zip code, county or a city or filters like property value by setting a min, max or a range by saying something like, "Show properties worth more than 700K". How can I help?'],
    type: 'error'
  },
  getValidRange: {
    response: ['That sounds like an invalid value to me. Please provide a value or range between 0 and 100%.'],
    type: 'error'
  },
  getValidRangeProperty: {
    response: ['That sounds like an invalid value to me. Please tell me a property price range you\'d like to see or you can change it on the screen as well.'],
    type: 'error'
  },
  unknownInput: {
    response: ['Sorry, I did not understand! Could you please try again!'],
    type: 'error'
  },
  invalidInputExtended: {
    response: ['My apologies, could you use the slider on the screen to input your range.'],
    type: 'error'
  },
  genericInvalidInput: {
    response: ['Sorry, it looks like an invalid input. Could you please rephrase or provide a valid input.'],
    type: 'error'
  },
  invalidRemoveAction: {
    response: ['Sorry, this filter or layer wasn\'t added before. What would you like to do next?'],
    type: 'error'
  },
  confirmClearFilter: {
    response: ['Are you sure you\'d like to remove the <%= filterDisplayName %> filter?'],
    type: 'confirmation'
  },
  rangeWithFilter: {
    response: ['Please specify the range along with the filter you\'d like.'],
    type: 'error'
  },
  noFilterCaptured: {
    response: ['Sorry could you repeat that, along with the filter type and whether you would like to add, change or remove the filter.'],
    type: 'error'
  },
  propensityDefault: {
    response: ['<%= ackPrefix %>! Here\'s the layer displaying scores between 500 and 599. I can always change this if you\'d like. What would you like to do next?'],
    type: 'success'
  },
  geographyChange: {
    response: ['That\'s going to change the location displayed, is that okay?'],
    type: 'confirmation'
  },
  firstTransactionTypeModified: {
    response: ['<%= ackPrefix %>. I\'ve added the <%= transaction_type %> layer. Is there anything else you\'d like to do?'],
    type: 'success'
  },
  transactionTypeModified: {
    response: ['Sure thing!',
      'Done, the changes should be reflected on the screen.'],
    type: 'success'
  },
  noMinimum: {
    response: ['Seems like the minimum value is already set to as low as it could go.'],
    type: 'error'
  },
  noMaximum: {
    response: ['Seems like the maximum value is already set to as high as it could go.'],
    type: 'error'
  },
  noMappingExists: {
    response: ['Hey it looks likes this mapping does not exist for this filter.'],
    type: 'error'
  },
  propertySpecificInfo: {
    response: ['"<%= insightAddress %>" is priced at <%= insightPropertyValue %> dollars, with an equity of <%= insightEquityValue %>%. The property value has <%= insightPropertyValueTrend %> and the average risk score is <%= insightAverageRiskScore %>.'],
    type: 'success'
  },
  propertyValueTrend: {
    response: ['This property’s value peaked in <%= insightPropertyValuePeakYear %> and has now <%= insightPropertyValueTrend %>. Here’s the graph.'],
    type: 'success'
  },
  askPropertyInfo: {
    response: ['Sure, please tap the property on the screen.'],
    type: 'error'
  },
  multipleErrorsGeneric: {
    response: [
      'Sorry I was unable to process that request, could you try mentioning one request at a time.',
      'Sorry at this time I can only process one request at a time. Could you also specify the criteria like equity, ltv, hail risk? It would also help to specify whether you\'d like to add, remove or update the criteria.'
    ],
    type: 'error'
  },
  invalidUndo: {
    response: ['I\'m not seeing any changes to undo. What else would you like to do?'],
    type: 'error'
  },
  propertyInfo: {
    response: ['There are <%= propertiesCount %> properties.'],
    type: 'success'
  },
  criteriaFAQ: {
    response: ['<%= response %>'],
    type: 'success'
  },
  startOverResponse: {
    response: ['Sure, tell me a region, city, county or a zip code along with its state.'],
    type: 'success'
  },
  removeRiskLayer: {
    response: [
      '<%= ackPrefix %>. That brings the amount of properties to <%= propertiesCount %> in the area.',
      '<%= ackPrefix %>, that changes our property count to <%= propertiesCount %> that fit your criteria.',
      'Sure that changes it to <%= propertiesCount %> properties in the area.',
      '<%= ackPrefix %>, with that change, <%= propertiesCount %> properties fit your criteria.',
      '<%= ackPrefix %>, that brings the total count to <%= propertiesCount %>.',
      '<%= ackPrefix %>. We now have <%= propertiesCount %> properties.',
      '<%= ackPrefix %>, with that, there are <%= propertiesCount %> properties that fit your criteria.'
    ],
    type: 'success'
  },
  confirmNewLocation: {
    response: ['Sure, which location would you like to go ahead with.'],
    type: 'confirmation'
  },
  internalError: {
    response: ['My apologies, we are experiencing some technical issues. I\'d love to help you later.'],
    type: 'error'
  },
  noPropertyMatch: {
    response: ['Sorry, I can\'t seem to find that property. Please make sure you are giving me a valid property address.'],
    type: 'error'
  },
  noResults: {
    response: ['Sorry there are no properties that match your criteria. We can explore other areas or other combination of filters if you like. How can I help?'],
    type: 'success'
  },
  modifyFiltersSuccess: {
    response: [
      'Absolutely. It\'s right here.',
      'Here are your properties.',
      'Sure thing.',
      'Here you go.',
      'Here you are.',
      'I\'ve got that right here.'
    ],
    type: 'success'
  },
  removeFiltersSuccess: {
    response: [
      'Absolutely. Here you go.',
      'Alright, I removed it.',
      'Alright, it\'s been removed.',
      'Done. Here are your properties.',
      'Sure thing.',
      'Done. Here you go.'
    ],
    type: 'success'
  },
  modifyGeographySuccess: {
    response: [
      'Okay, we\'re there.',
      'Sure. Here are your properties',
      'It\'s done',
      'Here we go. Have a look.',
      'Sure, here are the changes',
      'Done. Here you are.',
      'Here we go. Have a look.'
    ],
    type: 'success'
  },
  rangeValidationError: {
    response: ['Hold your horses, there. I don\'t see results because your request is out of range of this data. Can you adjust your numbers and try again?'],
    type: 'error'
  },
  multipleLienInsight: {
    response: ['What stands out for me is you have <%= lienCount %> properties with multiple liens against them. That\'s a very high risk.'],
    type: 'success'
  },
  taxLienInsight: {
    response: ['I\'m seeing that you have <%= lienCount %> properties with a tax lien against it. There\'s a high risk factor there.'],
    type: 'success'
  },
  hoaLienInsight: {
    response: ['I can immediately see some risk here. You have <%= lienCount %> properties with an H O A lien against it.'],
    type: 'success'
  },
  mechanicsLienInsight: {
    response: ['You have <%= lienCount %> properties with a Mechanics Lien against it. Not the most risky type, sure, but still worth looking into.'],
    type: 'success'
  },
  noLienInsight: {
    response: ['Well, look at this. I\'m not seeing any liens here. Pretty impressive, hotshot. Let\'s move on and see what else there is to see in your portfolio.'],
    type: 'success'
  },
  newLienInsight: {
    response: ['I\'m noticing <%= lienCount %> properties with new liens since your last session. Those are definitely worth looking at first.'],
    type: 'success'
  },
  recentHazardsExist: {
    response: ['Uh oh. It looks like a lot of your properties were impacted by some recent hazards. That\'s no good. Want to take a look at those?'],
    type: 'success'
  },
  noRecentHazards: {
    response: ['It doesn\'t look like your properties were impacted by any recent hazards. That\'s a relief. #PauseOne'],
    type: 'success'
  },
  newHazardsExists: {
    response: ['You have <%= hazardCount %> properties with high risk. Best to check these first. Sound good?'],
    type: 'success'
  },
  noNewHazards: {
    response: ['I\'m not finding any serious risk in your portfolio. Check back later in case your risk is seasonal!'],
    type: 'success'
  },
  switchToSellerLeads: {
    response: ['Okay, let\'s hop over to seller leads.'],
    type: 'success'
  },
  switchToHazards: {
    response: ['Alright, let\'s switch over to hazards.'],
    type: 'success'
  },
  switchToInvoluntaryLiens: {
    response: ['Sure, let\'s take a look at liens.'],
    type: 'success'
  },
  forceUseCaseSelection: {
    response: ['Okay. As my skills are continually updating I will be able to cover more topics soon. For now I\'m able to show you liens and seller leads. Which would you like to discuss first?'],
    type: 'error'
  },
  complexQuery: {
    response: ['Great question! But it\'s a bit too complex for the system to handle right now. Please choose one filter at a time.'],
    type: 'error'
  },
  catchAllError: {
    response: ['I just don\'t see any data for that.'],
    type: 'error'
  },
  whatElse: {
    response: [
      'In that case, What else can I show you? Take a look at the filters and choose.',
      'In that case, What else would you like to do?',
      'In that case, How else can we filter this data?',
      'In that case, Is there another way you\'d like to filter this?'
    ],
    type: 'error'
  },
  lienTypeError: {
    response: ['I\'m not finding any involuntary liens of that type.'],
    type: 'error'
  },
  equityError: {
    response: ['I\'m not finding any liens with that estimated equity.'],
    type: 'error'
  },
  lienToValueRatioError: {
    response: ['I\'m not finding any liens with that LTV.'],
    type: 'error'
  },
  lienAmountError: {
    response: ['I\'m not finding any liens at that value.'],
    type: 'error'
  },
  lienOrReleaseRecordingDateError: {
    response: ['Doesn\'t look like any liens were filed at that time.'],
    type: 'error'
  },
  geographyError: {
    response: ['I don\'t think you have any properties in that area.'],
    type: 'error'
  },
  genericFallbackResponse: {
    response: [
      'Sorry, what was that?',
      'I wasn\'t able to understand. Could you type your response, please?',
      'Uh oh. It looks like we\'re having some communication issues. What would you like to do?'
    ],
    type: 'error'
  },
  unguidedFallbackResponse: {
    response: [
      'Sorry, I was not able to process that request. Please try mentioning one filter at a time.',
      'Sorry, I can only process one request at a time currently. Please specify the filter you would like to use, and whether you\'d like to add, remove or update it.',
      'Sorry, I\'m not able to understand your request. Please use the filters available on the UI to perform your intended action.'
    ],
    type: 'error'
  }
};
