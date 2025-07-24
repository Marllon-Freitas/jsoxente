/**
 * The base class for all expression classes.
 * We don't instantiate this directly, but instead extend it.
 */
class Expr {
  /**
   * The base 'accept' method for the Visitor pattern.
   * This forces subclasses to implement their own version.
   * @param {Visitor} _visitor The visitor object.
   */
  accept(_visitor) {
    throw new Error("The 'accept' method must be implemented in the subclass.");
  }
}

class Visitor {
  visitBinaryExpr(_expr) { throw new Error("Method not implemented."); }
  visitGroupingExpr(_expr) { throw new Error("Method not implemented."); }
  visitLiteralExpr(_expr) { throw new Error("Method not implemented."); }
  visitUnaryExpr(_expr) { throw new Error("Method not implemented."); }
  visitTernaryExpr(_expr) { throw new Error("Method not implemented."); }
  visitVariableExpr(_expr) { throw new Error("Method not implemented."); }
  visitAssignExpr(_expr) { throw new Error("Method not implemented."); }
  visitCallExpr(_expr) { throw new Error("Method not implemented."); }
}

/**
 * Represents a binary operation in the tree.
 * Ex: 5 * 3
 */
class Binary extends Expr {
  constructor(left, operator, right) {
    super();
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  /**
   * Implements the Visitor pattern for Binary expressions.
   * @param {Visitor} visitor
   */
  accept(visitor) {
    return visitor.visitBinaryExpr(this);
  }
}

/**
 * Represents an assignment expression.
 * Ex: myVariable = "new value";
 */
class Assign extends Expr {
  /**
   * @param {Token} name The token for the variable being assigned to.
   * @param {Expr} value The new value expression.
   */
  constructor(name, value) {
    super();
    this.name = name;
    this.value = value;
  }
  
  accept(visitor) {
    return visitor.visitAssignExpr(this);
  }
}

/**
 * Represents a grouping expression.
 * Ex: (5 * 3)
 */
class Grouping extends Expr {
  constructor(expression) {
    super();
    this.expression = expression;
  }

  /**
   * Implements the Visitor pattern for Grouping expressions.
   * @param {Visitor} visitor
   */
  accept(visitor) {
    return visitor.visitGroupingExpr(this);
  }
}

/**
 * Represents a literal value.
 * Ex: 5, "hello", true, nil
 */
class Literal extends Expr {
  constructor(value) {
    super();
    this.value = value;
  }

  /**
   * Implements the Visitor pattern for Literal expressions.
   * @param {Visitor} visitor
   */
  accept(visitor) {
    return visitor.visitLiteralExpr(this);
  }
}

/**
 * Represents a unary operation.
 * Ex: -5, !isReady
 */
class Unary extends Expr {
  constructor(operator, right) {
    super();
    this.operator = operator;
    this.right = right;
  }

  /**
   * Implements the Visitor pattern for Unary expressions.
   * @param {Visitor} visitor
   */
  accept(visitor) {
    return visitor.visitUnaryExpr(this);
  }
}

/**
 * Represents a ternary operation.
 * Ex: condition ? trueValue : falseValue
 */
class Ternary extends Expr {
  constructor(condition, thenBranch, elseBranch) {
    super();
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }

  accept(visitor) {
    return visitor.visitTernaryExpr(this);
  }
}

/**
 * Represents a variable being accessed in an expression.
 * Ex: var myVariable;
 */
class Variable extends Expr {
  /**
   * @param {Token} name The token for the variable's name.
   */
  constructor(name) {
    super();
    this.name = name;
  }
  
  accept(visitor) {
    return visitor.visitVariableExpr(this);
  }
}

/**
 * Represents a function call expression.
 */
class Call extends Expr {
  /**
   * @param {Expr} callee The expression that evaluates to the function to be called.
   * @param {Token} paren The closing parenthesis token, used for error reporting.
   * @param {Expr[]} args The list of argument expressions.
   */
  constructor(callee, paren, args) {
    super();
    this.callee = callee;
    this.paren = paren;
    this.arguments = args;
  }
  accept(visitor) {
    return visitor.visitCallExpr(this);
  }
}


Expr.Visitor  = Visitor;
Expr.Assign   = Assign;
Expr.Binary   = Binary;
Expr.Grouping = Grouping;
Expr.Literal  = Literal;
Expr.Unary    = Unary;
Expr.Ternary  = Ternary;
Expr.Variable = Variable;
Expr.Call     = Call;

module.exports = Expr;