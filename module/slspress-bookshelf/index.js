module.exports.BookshelfComponent = require('./lib/bookshelf');
module.exports.BookshelfModelComponent = require('./lib/bookshelf-model');
module.exports.createNotFoundMapping = require('./lib/bookshelf-not-found-mapping').create;
module.exports.suppressNotFound = require('./lib/bookshelf-not-found-mapping').suppress;
module.exports.createValidationMapping = require('./lib/bookshelf-validation-mapping').create;
module.exports.suppressValidation = require('./lib/bookshelf-validation-mapping').suppress;
module.exports.createEmptyUpdateValidation = require('./lib/bookshelf-empty-update-mapping').create;
module.exports.surpressEmptyUpdateValidation = require('./lib/bookshelf-empty-update-mapping').suppress;