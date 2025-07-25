const TokenType = require('./TokenType');
const RuntimeError = require('./RuntimeError');
const Stmt = require('./Stmt');
const Environment = require('./Environment');
const Callable = require('./Callable');
const Function = require('./Function');
const Return = require('./Return');

/**
 * This is used just to report a break statement that is not inside a loop.
 */
class BreakInterrupt extends Error {}

/**
 * The Interpreter walks the AST and evaluates expressions to produce a final value.
 */
class Interpreter {
  /**
   * @param {function(RuntimeError): void} runtimeErrorReporter
   */
  constructor(runtimeErrorReporter) {
    this.runtimeError = runtimeErrorReporter;
    this.globals = new Environment();
    this.environment = this.globals;

    // Define a native 'clock' function.
    this.globals.define("clock", new class extends Callable {
      arity() {
        return 0;
      }

      call(_interpreter, _args) {
        return Date.now() / 1000.0;
      }

      toString() {
        return "<native fn>";
      }
    }());
  }

  /**
   * The main entry point for interpretation. It executes a list of statements.
   * @param {Stmt[]} statements The list of statements to execute.
   */
  interpret(statements) {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (error) {
      if (error instanceof RuntimeError) {
        this.runtimeError(error);
      } else {
        throw error;
      }
    }
  }

  // Statement execution methods:
  /**
   * Handles a function declaration statement.
   * @param {Stmt.Function} stmt The function statement node.
   */
  visitFunctionStmt(stmt) {
    const func = new Function(stmt, this.environment);
    this.environment.define(stmt.name.lexeme, func);
    
    return null;
  }

  visitVariableStmt(stmt) {
    let value = null;
    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.lexeme, value);
    return null;
  }

  visitReturnStmt(stmt) {
    let value = null;
    if (stmt.value !== null) {
      value = this.evaluate(stmt.value);
    }
    throw new Return(value);
  }

  visitWhileStmt(stmt) {
    try {
      while (this.isTruthy(this.evaluate(stmt.condition))) {
        this.execute(stmt.body);
      }
    } catch (error) {
      if (!(error instanceof BreakInterrupt)) {
        throw error;
      }
    }
    return null;
  }

  visitBreakStmt() {
    throw new BreakInterrupt();
  }

  visitIfStmt(stmt) {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch !== null) {
      this.execute(stmt.elseBranch);
    }
    return null;
  }

  visitBlockStmt(stmt) {
    this.executeBlock(stmt.statements, new Environment(this.environment));
    return null;
  }
  
  visitExpressionStmt(stmt) {
    this.evaluate(stmt.expression);
    return null;
  }
  
  visitPrintStmt(stmt) {
    const value = this.evaluate(stmt.expression);
    console.log(this.stringify(value));
    return null;
  }

  visitCallExpr(expr) {
    const callee = this.evaluate(expr.callee);
    const args = [];
    for (const argument of expr.arguments) {
      args.push(this.evaluate(argument));
    }

    if (!(callee instanceof Callable)) {
      throw new RuntimeError(expr.paren, "Can only call functions and classes.");
    }

    if (args.length !== callee.arity()) {
      throw new RuntimeError(expr.paren, `Expected ${callee.arity()} arguments but got ${args.length}.`);
    }

    return callee.call(this, args);
  }
  
  // Expression evaluation methods:
  visitAssignExpr(expr) {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name, value);
    return value;
  }

  visitVariableExpr(expr) {
    return this.environment.get(expr.name);
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

  execute(stmt) {
    stmt.accept(this);
  }

  evaluate(expr) {
    return expr.accept(this);
  }

  executeBlock(statements, environment) {
    const previous = this.environment;
    try {
      this.environment = environment;
      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
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