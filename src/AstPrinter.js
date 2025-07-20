/**
 * A class that acts as a Visitor to produce an unambiguous,
 * parenthesized string representation of an AST(Abstract Syntax Tree).
 */
class AstPrinter {
  /**
   * The main method to start the printing process.
   * @param {Expr} expr The root expression of the AST to print.
   * @returns {string}
   */
  print(expr) {
    return expr.accept(this);
  }

  visitBinaryExpr(expr) {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitGroupingExpr(expr) {
    return this.parenthesize("group", expr.expression);
  }

  visitLiteralExpr(expr) {
    if (expr.value === null) return "nil";
    return String(expr.value);
  }

  visitUnaryExpr(expr) {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  visitTernaryExpr(expr) {
    return this.parenthesize("?:", expr.condition, expr.thenBranch, expr.elseBranch);
  }

  /**
   * A helper method to wrap an expression and its parts in parentheses.
   * @private
   * @param {string} name The name of the operator or grouping.
   * @param  {...Expr} exprs A list of sub-expressions to format.
   * @returns {string}
   */
  parenthesize(name, ...exprs) {
    let result = `(${name}`;
    for (const expr of exprs) {
      result += ` ${expr.accept(this)}`;
    }
    result += ')';
    return result;
  }
}

module.exports = AstPrinter;