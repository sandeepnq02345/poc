'use strict';

/**
 * Maps dialogflow v3 webhook calls with its controller based on tag
 */

const tags = (tag) => {
  const mappedTag = mapper[tag];
  if (mappedTag) { return mappedTag; } else { return undefined; }
};

const mapper = {
  clear_filters: require('./logic/actions/clear-filters'),
  start_over: require('./logic/actions/start-over'),
  undo_operation: require('./logic/actions/undo-operation'),
  add_geography: require('./logic/geography/add-geography'),
  geo_change: require('./logic/geography/confirm-geo-change'),
  initial_geography: require('./logic/geography/initial-geography'),
  modify_geography: require('./logic/geography/modify-geography'),
  properties_count: require('./logic/insights/properties-count'),
  property_specific_comparables: require('./logic/insights/property-specific-comparables'),
  property_specific_faq: require('./logic/insights/property-specific-faq'),
  capture_range: require('./logic/capture-range'),
  criteria_faq: require('./logic/criteria-faq'),
  lien_insights: require('./logic/lien-insights'),
  hazard_insights: require('./logic/hazard-insights'),
  new_hazards: require('./logic/new-hazards'),
  modify_filters: require('./logic/modify-filters'),
  select_usecase: require('./logic/select-usecase'),
  switch_usecase: require('./logic/switch-usecase')
};

module.exports = tags;
