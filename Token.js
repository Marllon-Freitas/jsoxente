class Token {
  /**
   * @param {TokenType} type The type of the token.
   * @param {string} lexeme The sequence of characters from the source.
   * @param {any} literal The actual value of a literal (e.g., a number or string).
   * @param {number} line The line number where the lexeme appeared.
   */
  constructor(type, lexeme, literal, line) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
  }

  /**
   * Returns a string representation of the token for debugging.
   * @returns {string}
   */
  toString() {
    return `${this.type} ${this.lexeme} ${this.literal}`;
  }
}

module.exports = Token;