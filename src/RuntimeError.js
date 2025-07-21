const Token = require('./Token');

/**
 * A custom error class for reporting errors that occur during interpretation.
 */
class RuntimeError extends Error {
  /**
   * @param {Token} token The token that caused the error.
   * @param {string} message The error message.
   */
  constructor(token, message) {
    super(message);
    this.token = token;
  }
}

module.exports = RuntimeError;
