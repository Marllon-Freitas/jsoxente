const TokenType = require('./TokenType');
const Expr = require('./Expr');
const Token = require('./Token');
const Stmt = require('./Stmt');

class ParseError extends Error {}

// The grammar of the language is currently:
/**
  program        → declaration* EOF ;

  declaration    → varDecl
                | statement ;

  statement      → exprStmt
                | ifStmt
                | printStmt
                | whileStmt
                | block ;

  varDecl        → "var" IDENTIFIER ( "=" expression )? ";" ;
  exprStmt       → expression ";" ;
  printStmt      → "print" expression ";" ;
  block          → "{" declaration* "}" ;
  ifStmt         → "if" "(" expression ")" statement ( "else" statement )? ;
  whileStmt      → "while" "(" expression ")" statement ;

  expression     → assignment ;
  assignment     → IDENTIFIER "=" assignment | comma ;
  comma          → ternary ( ( "," ) ternary )* ;
  ternary        → equality ( "?" expression ":" ternary )? ;
  equality       → comparison ( ( "!=" | "==" ) comparison )* ;
  comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
  term           → factor ( ( "-" | "+" ) factor )* ;
  factor         → unary ( ( "/" | "*" ) unary )* ;
  unary          → ( "!" | "-" ) unary | primary ;
  primary        → NUMBER | STRING | "true" | "false" | "nil"
                | "(" expression ")" | IDENTIFIER ;
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
    this.loopDepth = 0;
  }

  /**
   * The main entry point. Parses a series of statements until it reaches the end.
   * @returns {Stmt[]} A list of statements.
   */
  parse() {
    const statements = [];
    while (!this.isAtEnd()) {
      const declaration = this.declaration();
      if (declaration !== null) {
        statements.push(declaration);
      }
    }
    return statements;
  }

  // Grammar Rule Methods for Statements:
  declaration() {
    try {
      if (this.match(TokenType.VAR)) return this.varDeclaration();
      return this.statement();
    } catch (error) {
      if (error instanceof ParseError) {
        this.synchronize();
        return null;
      }
      throw error;
    }
  }

  statement() {
    if (this.match(TokenType.BREAK)) return this.breakStatement();
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.LEFT_BRACE)) {
      return new Stmt.Block(this.block());
    }
    return this.expressionStatement();
  }

  breakStatement() {
    if (this.loopDepth == 0) {
      this.error(this.previous(), "Must be inside a loop to use 'break'.");
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after 'break'.");
    return new Stmt.Break();
  }

  ifStatement() {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.statement();
    let elseBranch = null;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }

    return new Stmt.If(condition, thenBranch, elseBranch);
  }

  forStatement() {
    this.loopDepth++;
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

    let initializer;
    if (this.match(TokenType.SEMICOLON)) {
      initializer = null;
    } else if (this.match(TokenType.VAR)) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition = null;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

    let increment = null;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expression();
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

    let body = this.statement();

    if (increment !== null) {
      body = new Stmt.Block([
        body,
        new Stmt.Expression(increment)
      ]);
    }

    if (condition === null) condition = new Expr.Literal(true);
    body = new Stmt.While(condition, body);

    if (initializer !== null) {
      body = new Stmt.Block([initializer, body]);
    }
    
    this.loopDepth--;
    return body;
  }

  whileStatement() {
    this.loopDepth++;
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
    const body = this.statement();

    this.loopDepth--;
    return new Stmt.While(condition, body);
  }

  block() {
    const statements = [];
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.declaration());
    }
    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  varDeclaration() {
    const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");
    let initializer = null;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return new Stmt.Var(name, initializer);
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
    return this.assignment();
  }

  assignment() {
    const expr = this.comma();

    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof Expr.Variable) {
        const name = expr.name;
        return new Expr.Assign(name, value);
      }

      this.error(equals, "Invalid assignment target.");
    }

    return expr;
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

    if (this.match(TokenType.IDENTIFIER)) {
      return new Expr.Variable(this.previous());
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

  synchronize() {
    this.advance();
    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;
      switch (this.peek().type) {
        case TokenType.CLASS: 
        case TokenType.FUN: 
        case TokenType.VAR:
        case TokenType.FOR: 
        case TokenType.IF: 
        case TokenType.WHILE:
        case TokenType.PRINT: 
        case TokenType.RETURN:
          return;
      }
      this.advance();
    }
  }
}

module.exports = Parser;