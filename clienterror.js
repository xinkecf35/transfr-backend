/**
 * Custom error type to handle client side errors
 * @param {*} message
 */
module.exports = function ClientError(message) {
  this.name = 'ClientError';
  this.message = message;
  this.stack = Error.captureStackTrace(this, this.constructor);
};

require('util').inherits(module.exports, Error);