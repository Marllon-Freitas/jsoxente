/**
 * An object that acts as an enum for all the token types in the Oxente language.
 */
const TokenType = Object.freeze({
  // Single-character tokens.
  LEFT_PAREN:  'LEFT_PAREN',      // '('
  RIGHT_PAREN: 'RIGHT_PAREN',     // ')'
  LEFT_BRACE:  'LEFT_BRACE',      // '{'
  RIGHT_BRACE: 'RIGHT_BRACE',     // '}'
  COMMA:       'COMMA',           // ','
  DOT:         'DOT',             // '.'
  MINUS:       'MINUS',           // '-'
  PLUS:        'PLUS',            // '+'
  SEMICOLON:   'SEMICOLON',       // ';'
  SLASH:       'SLASH',           // '/'
  STAR:        'STAR',            // '*'
  QUESTION:   'QUESTION',         // '?'
  COLON:       'COLON',           // ':'

  // One or two character tokens.
  BANG:          'BANG',          // '!'
  BANG_EQUAL:    'BANG_EQUAL',    // '!='
  EQUAL:         'EQUAL',         // '='
  EQUAL_EQUAL:   'EQUAL_EQUAL',   // '=='
  GREATER:       'GREATER',       // '>'
  GREATER_EQUAL: 'GREATER_EQUAL', // '>='
  LESS:          'LESS',          // '<'
  LESS_EQUAL:    'LESS_EQUAL',    // '<='

  // Literals.
  IDENTIFIER: 'IDENTIFIER',
  STRING:     'STRING',
  NUMBER:     'NUMBER',

  // Keywords.
  AND:    'AND',
  CLASS:  'CLASS',
  ELSE:   'ELSE',
  FALSE:  'FALSE',
  FUN:    'FUN',
  FOR:    'FOR',
  IF:     'IF',
  NIL:    'NIL',
  OR:     'OR',
  PRINT:  'PRINT',
  RETURN: 'RETURN',
  SUPER:  'SUPER',
  THIS:   'THIS',
  TRUE:   'TRUE',
  VAR:    'VAR',
  WHILE:  'WHILE',
  BREAK:  'BREAK',

  EOF: 'EOF'
});

module.exports = TokenType;