/**
 * A base class for any object that can be called like a function.
 */
class Callable {
  /**
   * Returns the number of arguments the function expects.
   * @returns {number}
   */
  arity() {
    throw new Error("Subclasses must implement the 'arity' method.");
  }

  /**
   * Executes the callable's logic.
   * @param {Interpreter} interpreter The interpreter instance.
   * @param {any[]} args The list of evaluated argument values.
   */
  call(_interpreter, _args) {
    throw new Error("Subclasses must implement the 'call' method.");
  }
}

module.exports = Callable;