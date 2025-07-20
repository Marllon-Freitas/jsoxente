const Token = require('./Token');
const TokenType = require('./TokenType');

const {
  LEFT_PAREN, RIGHT_PAREN, LEFT_BRACE, RIGHT_BRACE, COMMA, DOT, MINUS,
  PLUS, SEMICOLON, SLASH, STAR, QUESTION, COLON, BANG, BANG_EQUAL, EQUAL, EQUAL_EQUAL,
  GREATER, GREATER_EQUAL, LESS, LESS_EQUAL, IDENTIFIER, STRING, NUMBER,
  AND, CLASS, ELSE, FALSE, FUN, FOR, IF, NIL, OR, PRINT, RETURN, SUPER,
  THIS, TRUE, VAR, WHILE, EOF
} = TokenType;

// A map of reserved keywords to their token types.
const keywords = {
  "and":    AND,
  "class":  CLASS,
  "else":   ELSE,
  "false":  FALSE,
  "for":    FOR,
  "fun":    FUN,
  "if":     IF,
  "nil":    NIL,
  "or":     OR,
  "print":  PRINT,
  "return": RETURN,
  "super":  SUPER,
  "this":   THIS,
  "true":   TRUE,
  "var":    VAR,
  "while":  WHILE,
};

/**
 * The Scanner, also known as the Lexer, is responsible for iterating through the
 * source code and breaking it down into a series of "tokens". Each token is a
 * small, meaningful unit of the language, like a number, a string, a parenthesis,
 * or a keyword.
 */
class Scanner {
  source;
  tokens = [];
  errorReporter;
  start = 0;
  current = 0;
  line = 1;

  /**
   * Initializes the scanner.
   * @param {string} source The raw source code string to be scanned.
   * @param {function(number, string): void} errorReporter A function to be called when a lexical error is found.
   */
  constructor(source, errorReporter) {
    this.source = source;
    this.errorReporter = errorReporter;
  }

  /**
   * The main method that scans the entire source code.
   * It loops through the source string character by character, generating tokens
   * until it's finished, at which point it appends a final 'EOF' (End of File) token.
   * @returns {Token[]} An array of tokens scanned from the source code.
   */
  scanTokens() {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }
    this.tokens.push(new Token(EOF, "", null, this.line));
    return this.tokens;
  }

  /**
   * Scans and processes a single token. This is the heart of the scanner,
   * where the decision is made about what kind of lexeme we're looking at.
   * @private
   */
  scanToken() {
    const c = this.advance();
    switch (c) {
      case '(': this.addToken(LEFT_PAREN); break;
      case ')': this.addToken(RIGHT_PAREN); break;
      case '{': this.addToken(LEFT_BRACE); break;
      case '}': this.addToken(RIGHT_BRACE); break;
      case ',': this.addToken(COMMA); break;
      case '.': this.addToken(DOT); break;
      case '-': this.addToken(MINUS); break;
      case '+': this.addToken(PLUS); break;
      case ';': this.addToken(SEMICOLON); break;
      case '*': this.addToken(STAR); break;
      case '?': this.addToken(QUESTION); break;
      case ':': this.addToken(COLON); break;
      case '!': this.addToken(this.match('=') ? BANG_EQUAL : BANG); break;
      case '=': this.addToken(this.match('=') ? EQUAL_EQUAL : EQUAL); break;
      case '<': this.addToken(this.match('=') ? LESS_EQUAL : LESS); break;
      case '>': this.addToken(this.match('=') ? GREATER_EQUAL : GREATER); break;
      case '/':
        if (this.match('/')) {
          // A single-line comment goes until the end of the line.
          while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
        } else if (this.match('*')) {
          this.blockComment();
        } else {
          this.addToken(SLASH);
        }
        break;
      
      // Ignore whitespace.
      case ' ':
      case '\r':
      case '\t':
        break;

      case '\n':
        this.line++;
        break;

      case '"': this.string(); break;

      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          this.errorReporter(this.line, "Unexpected character.");
        }
        break;
    }
  }

  /**
   * Scans a string literal. Consumes characters until a closing quote (") is
   * found. Handles multi-line strings and reports an error if the string
   * is unterminated.
   * @private
   */
  string() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') this.line++;
      this.advance();
    }
    if (this.isAtEnd()) {
      this.errorReporter(this.line, "Unterminated string.");
      return;
    }
    // Consume the closing ".
    this.advance();
    // Extract the string's value, without the surrounding quotes.
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(STRING, value);
  }

  /**
   * Scans a C-style block comment 
   * @private
   */
  blockComment() {
    while (!this.isAtEnd()) {
      if (this.peek() === '*' && this.peekNext() === '/') {
        this.advance(); // consume '*'
        this.advance(); // consume '/'
        return;
      }
      if (this.peek() === '\n') {
        this.line++;
      }
      this.advance();
    }
    // If we get here, the file ended before the comment was closed.
    this.errorReporter(this.line, "Unterminated block comment.");
  }
  
  /**
   * Scans a number literal, which can be an integer or have a fractional part.
   * @private
   */
  number() {
    while (this.isDigit(this.peek())) this.advance();
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      // Consume the ".".
      this.advance();
      while (this.isDigit(this.peek())) this.advance();
    }
    const value = parseFloat(this.source.substring(this.start, this.current));
    this.addToken(NUMBER, value);
  }

  /**
   * Scans an identifier (e.g., variable name) or a keyword.
   * @private
   */
  identifier() {
    while (this.isAlphaNumeric(this.peek())) this.advance();
    const text = this.source.substring(this.start, this.current);
    const type = keywords[text] || IDENTIFIER;
    this.addToken(type);
  }
  
  /**
   * Checks if the current character matches the expected one. If so, it consumes
   * the character and returns true. Otherwise, it returns false.
   * @param {string} expected The character to check for.
   * @returns {boolean} `true` if matched, `false` otherwise.
   * @private
   */
  match(expected) {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;
    this.current++;
    return true;
  }

  /**
   * Returns the current character without consuming it (1-character lookahead).
   * @returns {string} The current character.
   * @private
   */
  peek() {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }

  /**
   * Returns the character after the current one without consuming it (2-character lookahead).
   * @returns {string} The next character.
   * @private
   */
  peekNext() {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source[this.current + 1];
  }
  
  /**
   * Checks if a character is a digit '0' through '9'.
   * @param {string} char The character to check.
   * @returns {boolean} `true` if the character is a digit, `false` otherwise.
   * @private
   */
  isDigit(char) {
    return char >= '0' && char <= '9';
  }

  /**
   * Checks if a character is a letter ('a'-'z', 'A'-'Z') or an underscore.
   * @param {string} char The character to check.
   * @returns {boolean} `true` if the character is alpha.
   * @private
   */
  isAlpha(char) {
    return (char >= 'a' && char <= 'z') ||
           (char >= 'A' && char <= 'Z') ||
           char === '_';
  }

  /**
   * Checks if a character is a letter, underscore, or digit.
   * @param {string} char The character to check.
   * @returns {boolean} `true` if the character is alphanumeric.
   * @private
   */
  isAlphaNumeric(char) {
    return this.isAlpha(char) || this.isDigit(char);
  }

  /**
   * Checks if the scanner has reached the end of the source code.
   * @returns {boolean} `true` if all characters have been consumed.
   * @private
   */
  isAtEnd() {
    return this.current >= this.source.length;
  }

  /**
   * Consumes the current character in the source string and returns it.
   * @returns {string} The character that was consumed.
   * @private
   */
  advance() {
    return this.source[this.current++];
  }

  /**
   * Creates a new token for the current lexeme and adds it to the token list.
   * @param {TokenType} type The type of the token.
   * @param {any} [literal=null] The literal value (e.g., the number 2, the string "hello").
   * @private
   */
  addToken(type, literal = null) {
    const text = this.source.substring(this.start, this.current);
    const token = new Token(type, text, literal, this.line);
    this.tokens.push(token);
  }
}

module.exports = Scanner;