const configuration = require('./framework.json');
const logger = require('../lib/logger');
const _ = require('lodash');

/**
 * Base class containing all global methods
 */
class StateParamsHandler {
  constructor (df) {
    this.df = df;
    this.stateParams = _.cloneDeep(df.getStateParams());
    this.output = {}; // rename
  }

  setSessionParameter (key, value) {
    this.df.setParameter(key, value);
  }

  setPredicate () { // name to -> set current state
    this.output.predicate = this.predicate || 'and';
  }

  setMinMaxRange () {
    const { min: sliderMin, max: sliderMax } = this.config.sliderRange;
    if (this.hasRange) {
      const [value, min, max] = [this.range.value, this.range.min, this.range.max];
      if (!this.isRemove) {
        switch (this.operator) {
          case 'greater than':
            this.output.max = (value >= this.currentState.max)
              ? sliderMax : this.currentState.max;
            this.output.min = value;
            break;
          case 'less than':
            this.output.min = (value <= this.currentState.min)
              ? sliderMin : this.currentState.min;
            this.output.max = value;
            break;
          case 'around':
            switch (this.filterName) {
              case 'propertyValue':
              case 'lienAmount':
                this.output.min = value - (0.1 * value);
                this.output.max = value + (0.1 * value);
                break;

              case 'propensityToSell': {
                const mappings = this.config.mappings;
                for (const mappingValues in mappings) {
                  const [mappingMin, mappingMax] = [mappings[mappingValues].min, mappings[mappingValues].max];
                  if (mappingMin <= value && value <= mappingMax) {
                    this.output.min = mappingMin;
                    this.output.max = mappingMax;
                    break;
                  }
                }
                break;
              }

              default:
                this.output.min = value - 5;
                this.output.max = value + 5;
                break;
            }
            this.output.min = (this.output.min < sliderMin) ? sliderMin : this.output.min;
            this.output.max = (this.output.max > sliderMax) ? sliderMax : this.output.max;
            break;

          case 'between':
            this.output.min = min;
            this.output.max = max;
            break;

          default:
            logger.log('info', `Case not handled: ${this.operator}`);
            this.output.min = min;
            this.output.max = max;
            break;
        }
      } else {
        switch (this.operator) {
          case 'greater than':
            this.output.min = (value <= this.currentState.min || value >= this.currentState.max)
              ? sliderMin : this.currentState.min;
            this.output.max = value;
            break;
          case 'less than':
            this.output.max = (value <= this.currentState.min || value >= this.currentState.max)
              ? sliderMax : this.currentState.max;
            this.output.min = value;
            break;
          default:
            logger.log('error', `Case not handled: ${this.operator}`);
            break;
        }
      }
    }
  }

  setDateRange () {
    const currentStartDate = _.get(this.stateParams, this.filterSchema) ? new Date(_.get(this.stateParams, this.filterSchema).startDate) : null;
    const currentEndDate = _.get(this.stateParams, this.filterSchema) ? new Date(_.get(this.stateParams, this.filterSchema).endDate) : null;
    if (!this.isRemove) {
      if (this.dateRange.startDate) {
        this.output = this.dateRange;
        if (this.operator === 'greater than' && this.dateRange.startDate < currentEndDate) {
          this.output.endDate = currentEndDate;
        }
      } else if (currentStartDate && this.dateRange.endDate > currentStartDate) {
        this.output.startDate = currentStartDate;
        this.output.endDate = this.dateRange.endDate;
      } else {
        this.output = this.getOneYearDateRange(this.dateRange.endDate);
      }
    } else {
      switch (this.operator) {
        case 'greater than':
          if (currentStartDate < this.dateRange.startDate && this.dateRange.startDate < currentEndDate) {
            this.output.endDate = this.dateRange.startDate;
          }
          break;
        case 'less than':
          if (currentStartDate < this.dateRange.endDate && this.dateRange.endDate < currentEndDate) {
            this.output.startDate = this.dateRange.endDate;
          }
          break;
        default:
          logger.log('error', `Case not handled: ${this.operator}`);
          break;
      }
    }
  }

  setLayerStatus () {
    if (!this.isRemove) {
      this.output.status = true;
    } else {
      this.output.status = false;
    }
  }

  setDefaultSliderRange () {
    if (this.config.defaultRange && !_.get(this.stateParams, this.filterSchema)) {
      _.merge(this.output, this.getDefaultConfig());
    }
  }

  setMultipleLayerStatus (layersStatus) {
    this.output = layersStatus;
  }

  setStateParams () {
    this.mergeToStateParams(this.output);
    if (configuration.checkBox.includes(this.filterSchema) && this.filterType !== 'checkBox') {
      this.mergeToStateParams({ status: true });
    }
  }

  mergeToStateParams (output) {
    let processedOutput = _.get(this.stateParams, this.filterSchema);
    if ((_.isArray(output) && _.isEmpty(output)) || _.isUndefined(processedOutput)) {
      processedOutput = output;
    } else {
      processedOutput = _.merge(processedOutput, output);
    }
    this.stateParams = _.set(this.stateParams, this.filterSchema, processedOutput);
  }

  setConfiguration () {
    this.config = configuration.filters[this.filterName];
  }

  getDefaultConfig () {
    return configuration.filters[this.filterName].defaultRange;
  }
}

module.exports = StateParamsHandler;
