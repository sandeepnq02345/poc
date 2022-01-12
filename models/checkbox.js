const StateParamsHandler = require('./state-params-handler');
const _ = require('lodash');

/**
 * Checkbox class to implement the Layers
 */
class CheckBox extends StateParamsHandler {
  /**
   * constructor of checkbox
   * @param  {object} df dialogflow object
   * @param  {object} capturedParameters JSON object of DFCX captured parameters
   */
  constructor (df, capturedParameters) {
    super(df);
    const { action, filterName, filterSchema, filterType } = capturedParameters;
    this.filterName = filterName;
    this.filterSchema = filterSchema;
    this.filterType = filterType;
    this.isRemove = !!(action);
    this.hasValidationError = false;
    this.setConfiguration();
    this.currentState = _.get(this.stateParams, this.filterSchema) || { status: false };

    this.validate();
    if (!this.hasValidationError) {
      this.process();
      this.setStateParams();
    }
  }

  /**
   * Validation Function
   */
  validate () {
    try {
      this.validateRemoveAction();
      this.checkIfAlreadyExists();
    } catch (error) {
      this.hasValidationError = true;
    }
  }

  /**
   * Processing Function to set the Layer status
   */
  process () {
    this.setLayerStatus();
    this.setDefaultSliderRange();
  }

  /**
   * Checks if filter present if the action is 'remove'.
   */
  validateRemoveAction () {
    if (this.isRemove) {
      const filter = _.get(this.stateParams, this.filterSchema);
      if (!filter || (filter && filter.status === false)) {
        this.responseTemplate = (!filter) ? 'invalidRemoveAction' : 'layerNotActive';
        throw new Error();
      }
    }
  }

  /**
   * Validates if the filter is already present or not.
   */
  checkIfAlreadyExists () {
    if (!this.isRemove) {
      const filter = _.get(this.stateParams, this.filterSchema);
      if (filter && filter.status === true) {
        this.responseTemplate = 'criteriaAlreadyApplied';
        throw new Error();
      }
    }
  }
}

module.exports = { CheckBox };
