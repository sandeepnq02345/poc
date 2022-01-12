const StateParamsHandler = require('./state-params-handler');
const _ = require('lodash');

/**
 * Class to implement group of checkboxes
 * example: Involuntary Liens
 */
class InvoluntaryLiens extends StateParamsHandler {
  // to inherit

  /**
   * involuntary constructor
   * @param  {Object} df dialogflow object
   * @param  {Object} capturedParameters JSON object of DFCX captured parameters
   */
  constructor (df, capturedParameters) {
    super(df);
    const { action, filterName, filterSchema, filterType, lienType } = capturedParameters;
    this.isRemove = !!(action);
    this.filterName = filterName;
    this.filterSchema = filterSchema;
    this.filterType = filterType;
    this.lienType = lienType;
    this.action = action;
    this.setConfiguration();
    this.types = this.config.lienTypes;
    this.doNotValidate = ['involuntary', 'new'];

    if (this.lienType === 'new') {
      this.filterSchema = 'lienOrReleaseRecordingDate';
    }

    this.validate();
    if (!this.hasValidationError) {
      this.process();
      this.setStateParams();
    }
  }

  /**
  * Processing Function to set all the Layer status
  */
  process () {
    this.setMultipleLayerStatus(this.performAction(this.action));
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
   * Checks if filter present if the action is 'remove'.
   */
  validateRemoveAction () {
    if (this.isRemove) {
      const filter = _.get(this.stateParams, this.filterSchema);
      if (!filter || (filter && !this.doNotValidate.includes(this.lienType) && !filter.includes(this.lienType))) {
        this.responseTemplate = 'invalidRemoveAction';
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
      if (filter && !this.doNotValidate.includes(this.lienType) && filter.includes(this.lienType)) {
        this.responseTemplate = 'criteriaAlreadyApplied';
        throw new Error();
      }
    }
  }

  /**
   * Choose between setting status true or false
   * @param  {string} remove
   */
  performAction (remove) {
    if (!remove) { return this.select(); }
    return this.deselect();
  }

  /**
   * Set status to true
   */
  select () {
    if (this.lienType === 'new') {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 1);
      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
    }

    if (this.lienType !== 'involuntary' && this.types.includes(this.lienType)) {
      if (_.isUndefined(_.get(this.stateParams, this.filterSchema))) return [this.lienType];
      else return [..._.get(this.stateParams, this.filterSchema), this.lienType];
    } else {
      return this.types;
    }
  };

  /**
   * Set status to false
   */
  deselect () {
    if (this.lienType === 'new') {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);
      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
    }

    if (this.lienType !== 'involuntary' && this.types.includes(this.lienType)) {
      const index = _.get(this.stateParams, this.filterSchema).indexOf(this.lienType);
      if (index > -1) {
        _.get(this.stateParams, this.filterSchema).splice(index, 1);
      }
      return _.get(this.stateParams, this.filterSchema);
    } else {
      return [];
    }
  }
}

module.exports = { InvoluntaryLiens };
