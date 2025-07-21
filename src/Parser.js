const TokenType = require('./TokenType');
const Expr = require('./Expr');
const Token = require('./Token');
const Stmt = require('./Stmt');

class ParseError extends Error {}

// The grammar of the language is currently:
/**
  program        → statement* EOF ;

  statement      → exprStmt
                | printStmt ;

  exprStmt       → expression ";" ;
  printStmt      → "print" expression ";" ;

  expression     → comma ;
  comma          → ternary ( ( "," ) ternary )* ;
  ternary        → equality ( "?" expression ":" ternary )? ;
  equality       → comparison ( ( "!=" | "==" ) comparison )* ;
  comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
  term           → factor ( ( "-" | "+" ) factor )* ;
  factor         → unary ( ( "/" | "*" ) unary )* ;
  unary          → ( "!" | "-" ) unary | primary ;
  primary        → NUMBER | STRING | "true" | "false" | "nil"
                | "(" expression ")" ;
  */

/**
 * The Parser is responsible for taking a sequence of tokens from the Scanner
 * and producing an abstract syntax tree (AST) that represents the grammatical
 * structure of the source code.
 */
class Parser {
  /**
   * @param {Token[]} tokens The list of tokens from the Scanner.
   * @param {function(Token, string): void} errorReporter A function to report errors.
   */
  constructor(tokens, errorReporter) {
    this.tokens = tokens;
    this.errorReporter = errorReporter;
    this.current = 0;
  }

  /**
   * The main entry point. Parses a series of statements until it reaches the end.
   * @returns {Stmt[]} A list of statements.
   */
  parse() {
    const statements = [];
    while (!this.isAtEnd()) {
      statements.push(this.statement());
    }
    return statements;
  }

  // Gramar Rule Methods for Statements:
  statement() {
    if (this.match(TokenType.PRINT)) {
      return this.printStatement();
    }
    return this.expressionStatement();
  }

  printStatement() {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new Stmt.Print(value);
  }

  expressionStatement() {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new Stmt.Expression(expr);
  }

  // Gramar Rule Methods for Expressions:
  expression() {
    return this.comma();
  }

  comma() {
    let expr = this.ternary();
    while (this.match(TokenType.COMMA)) {
      const operator = this.previous();
      const right = this.ternary();
      expr = new Expr.Binary(expr, operator, right);
    }
    return expr;
  }

  ternary() {
    let expr = this.equality();
    if (this.match(TokenType.QUESTION)) {
      const thenBranch = this.expression();
      this.consume(TokenType.COLON, "Expect ':' after then branch of conditional expression.");
      const elseBranch = this.ternary();
      expr = new Expr.Ternary(expr, thenBranch, elseBranch);
    }
    return expr;
  }

  equality() {
    if (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      this.error(this.previous(), "Missing left-hand operand.");
      this.comparison();
      return new Expr.Literal(null);
    }

    let expr = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new Expr.Binary(expr, operator, right);
    }
    return expr;
  }
  
  comparison() {
    if (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
      this.error(this.previous(), "Missing left-hand operand.");
      this.term();
      return new Expr.Literal(null);
    }

    let expr = this.term();

    while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
      const operator = this.previous();
      const right = this.term();
      expr = new Expr.Binary(expr, operator, right);
    }
    return expr;
  }
  
  term() {
    if (this.match(TokenType.PLUS)) {
      this.error(this.previous(), "Missing left-hand operand.");
      this.factor();
      return new Expr.Literal(null);
    }

    let expr = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = new Expr.Binary(expr, operator, right);
    }
    
    return expr;
  }
  
  factor() {
    if (this.match(TokenType.SLASH, TokenType.STAR)) {
      this.error(this.previous(), "Missing left-hand operand.");
      this.unary();
      return new Expr.Literal(null);
    }

    let expr = this.unary();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  unary() {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new Expr.Unary(operator, right);
    }

    return this.primary();
  }
  
  primary() {
    if (this.match(TokenType.FALSE)) return new Expr.Literal(false);
    if (this.match(TokenType.TRUE)) return new Expr.Literal(true);
    if (this.match(TokenType.NIL)) return new Expr.Literal(null);
    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new Expr.Literal(this.previous().literal);
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new Expr.Grouping(expr);
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  consume(type, message) {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }

  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }
  
  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }
  
  peek() {
    return this.tokens[this.current];
  }

  previous() {
    return this.tokens[this.current - 1];
  }

  error(token, message) {
    this.errorReporter(token, message);
    return new ParseError();
  }
}

module.exports = Parser;