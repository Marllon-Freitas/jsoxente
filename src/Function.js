const Environment = require('./Environment');
const Callable = require('./Callable');
const Interpreter = require('./Interpreter');
const Return = require('./Return');

/**
 * The runtime representation of a user-defined function.
 */
class Function extends Callable {
  /**
   * @param {Stmt.Function} declaration The syntax tree node for the function declaration.
   * @param {Environment} closure The environment where the function was declared.
   */
  constructor(declaration, closure) {
    super();
    this.declaration = declaration;
    this.closure = closure;
  }

  arity() {
    return this.declaration.params.length;
  }

  /**
   * Executes the function.
   * @param {Interpreter} interpreter The interpreter instance.
   * @param {any[]} args The list of evaluated argument values.
   */
  call(interpreter, args) {
    const environment = new Environment(this.closure); 
    
    for (let i = 0; i < this.declaration.params.length; i++) {
      const paramName = this.declaration.params[i].lexeme;
      const argumentValue = args[i];
      environment.define(paramName, argumentValue);
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (returnValue) {
      if (returnValue instanceof Return) {
        return returnValue.value;
      }
      throw returnValue;
    }
    
    return null;
  }

  toString() {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}

module.exports = Function;