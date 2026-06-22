const path = require('path');
const { createValidationMiddleware } = require('./middleware');
const { formatErrors } = require('./format-errors');
const { validate } = require('./validators');

module.exports = {
  createValidationMiddleware,
  formatErrors,
  validate,
  macroPath: path.join(__dirname, '..', 'macros', 'validation.njk'),
};
