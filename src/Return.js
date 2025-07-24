/**
 * A custom error-like class used for control flow to handle return statements.
 * It is not a true error, but an exception is a convenient way to unwind the call stack.
 */
class Return extends Error {
  constructor(value) {
    super(null);
    this.name = "ReturnInterrupt";
    this.value = value;
  }
}

module.exports = Return;