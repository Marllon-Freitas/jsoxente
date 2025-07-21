/**
 * The base class for all statement classes.
 * We don't instantiate this directly, but instead extend it.
 */
class Stmt {
  /**
   * The base 'accept' method for the Visitor pattern.
   * @param {Visitor} _visitor
   */
  accept(_visitor) {
    throw new Error("The 'accept' method must be implemented in the subclass.");
  }
}

class Visitor {
  visitExpressionStmt(_stmt) { throw new Error("Method not implemented."); }
  visitPrintStmt(_stmt) { throw new Error("Method not implemented."); }
  visitVariableStmt(_stmt) { throw new Error("Method not implemented."); }
}

/**
 * Represents an expression statement.
 * Ex: 5 + 3;
 */
class Expression extends Stmt {
  /**
   * @param {Expr} expression
   */
  constructor(expression) {
    super();
    this.expression = expression;
  }

  accept(visitor) {
    return visitor.visitExpressionStmt(this);
  }
}

/**
 * Represents a print statement.
 * Ex: print "Hello, world!";
 */
class Print extends Stmt {
  /**
   * @param {Expr} expression The expression whose value will be printed.
   */
  constructor(expression) {
    super();
    this.expression = expression;
  }

  accept(visitor) {
    return visitor.visitPrintStmt(this);
  }
}

/**
 * Represents a variable declaration statement.
 * Ex: var name = "value";
 */
class Var extends Stmt {
  /**
   * @param {Token} name The variable's name (an IDENTIFIER token).
   * @param {Expr | null} initializer The expression the variable is initialized to.
   */
  constructor(name, initializer) {
    super();
    this.name = name;
    this.initializer = initializer;
  }

  accept(visitor) {
    return visitor.visitVariableStmt(this);
  }
}

Stmt.Visitor = Visitor;
Stmt.Expression = Expression;
Stmt.Print = Print;
Stmt.Var = Var;

module.exports = Stmt;