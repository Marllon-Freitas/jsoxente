const TokenType = require('./TokenType');

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

/**
 * The Interpreter walks the AST and evaluates expressions to produce a final value.
 */
class Interpreter {
  /**
   * @param {function(RuntimeError): void} runtimeErrorReporter
   */
  constructor(runtimeErrorReporter) {
    this.runtimeError = runtimeErrorReporter;
  }

  interpret(expression) {
    try {
      const value = this.evaluate(expression);
      console.log(this.stringify(value));
    } catch (error) {
      if (error instanceof RuntimeError) {
        this.runtimeError(error);
      } else {
        throw error;
      }
    }
  }

  visitLiteralExpr(expr) {
    return expr.value;
  }

  visitGroupingExpr(expr) {
    return this.evaluate(expr.expression);
  }

  visitUnaryExpr(expr) {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator, right);
        return -Number(right);
      case TokenType.BANG:
        return !this.isTruthy(right);
    }
    return null;
  }

  visitBinaryExpr(expr) {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) - Number(right);
      case TokenType.SLASH:
        this.checkNumberOperands(expr.operator, left, right);
        if (Number(right) === 0) {
          throw new RuntimeError(expr.operator, "Division by zero.");
        }
        return Number(left) / Number(right);
      case TokenType.STAR:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) * Number(right);
      case TokenType.PLUS:
        if (typeof left === 'number' && typeof right === 'number') {
          return left + right;
        }
        if (typeof left === 'string' || typeof right === 'string') {
          return this.stringify(left) + this.stringify(right);
        }
        throw new RuntimeError(expr.operator, "Operands must be two numbers or two strings.");
      
      case TokenType.GREATER:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) > Number(right);
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) >= Number(right);
      case TokenType.LESS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) < Number(right);
      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) <= Number(right);

      case TokenType.BANG_EQUAL: return !this.isEqual(left, right);
      case TokenType.EQUAL_EQUAL: return this.isEqual(left, right);
    }
    return null;
  }

  visitTernaryExpr(expr) {
    const condition = this.evaluate(expr.condition);
    if (this.isTruthy(condition)) {
      return this.evaluate(expr.thenBranch);
    } else {
      return this.evaluate(expr.elseBranch);
    }
  }

  evaluate(expr) {
    return expr.accept(this);
  }

  checkNumberOperand(operator, operand) {
    if (typeof operand === 'number') return;
    throw new RuntimeError(operator, "Operand must be a number.");
  }

  checkNumberOperands(operator, left, right) {
    if (typeof left === 'number' && typeof right === 'number') return;
    throw new RuntimeError(operator, "Operands must be numbers.");
  }

  isTruthy(object) {
    if (object === null) return false;
    if (typeof object === 'boolean') return object;
    return true;
  }

  isEqual(a, b) {
    if (a === null && b === null) return true;
    if (a === null) return false;
    return a === b;
  }
  
  stringify(object) {
    if (object === null) return "nil";
    if (typeof object === 'number') {
      let text = String(object);
      if (text.endsWith(".0")) {
        text = text.substring(0, text.length - 2);
      }
      return text;
    }
    return String(object);
  }
}

module.exports = Interpreter;