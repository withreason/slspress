const Joi = require('joi');

/*
  Explicitly validate on insert. This fixes an issue with only the timestamp field validations being applied when
  using own generated ids.
  TODO push this back to bookshelf-modelbase
 */
module.exports = (ModelBase) => {
  return ModelBase.extend({
    validateSave: function (model, attrs, options) {
      if (options && options.method === 'insert') {
        // do full validation
        const validation = Joi.validate(this.attributes, this.validate);
        if (validation.error) {
          validation.error.tableName = this.tableName;
          throw validation.error
        }
        this.set(validation.value);
        return validation.value;
      }
      return ModelBase.prototype.validateSave.apply(this, arguments);
    }
  });
};