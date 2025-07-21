const RuntimeError = require('./RuntimeError');
const Token = require('./Token');

/**
 * The Environment class keeps track of variable bindings.
 * It supports nesting to handle lexical scope.
 */
class Environment {
  /**
   * @param {Environment | null} enclosing The enclosing (parent) environment.
   */
  constructor(enclosing = null) {
    this.enclosing = enclosing;
    this.values = new Map();
  }

  /**
   * Binds a new name to a value. Redefining an existing variable is allowed.
   * @param {string} name The variable's name.
   * @param {any} value The value to bind.
   */
  define(name, value) {
    this.values.set(name, value);
  }

  /**
   * Retrieves the value bound to a variable's name.
   * Throws a runtime error if the variable is not defined.
   * @param {Token} name The token for the variable's name.
   * @returns {any} The value of the variable.
   */
  get(name) {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme);
    }

    if (this.enclosing !== null) {
      return this.enclosing.get(name);
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  /**
   * Assigns a new value to an existing variable.
   * Throws a runtime error if the variable is not defined.
   * @param {Token} name The token for the variable's name.
   * @param {any} value The new value.
   */
  assign(name, value) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing !== null) {
      this.enclosing.assign(name, value);
      return;
    }
    
    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }
}

module.exports = Environment;