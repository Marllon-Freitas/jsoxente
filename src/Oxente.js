const fs = require('fs');
const process = require('process');
const readline = require('readline');

const Scanner = require('./Scanner');
const Parser = require('./Parser');
const AstPrinter = require('./AstPrinter');
const TokenType = require('./TokenType');
const Token = require('./Token');

let hadError = false;

function main() {
  const args = process.argv.slice(2);

  if (args.length > 1) {
    console.log("Usage: node oxente.js [script.oxe]");
    process.exit(64); 
  } else if (args.length === 1) {
    runFile(args[0]);
  } else {
    runPrompt();
  }
}

function runFile(path) {
  try {
    const source = fs.readFileSync(path, 'utf8');
    run(source);
    if (hadError) process.exit(65);
  } catch (error) {
    console.error(`Error reading file: ${path}`);
    process.exit(74);
  }
}

function runPrompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  rl.prompt();

  rl.on('line', (line) => {
    run(line);
    hadError = false;
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\nExiting.');
    process.exit(0);
  });
}

/**
 * The core function that runs the source code.
 * @param {string} source - The source code to execute.
 */
function run(source) {
  const scanner = new Scanner(source, error);
  const tokens = scanner.scanTokens();

  if (hadError) return;

  const parser = new Parser(tokens, error);
  const expression = parser.parse();

  console.log(new AstPrinter().print(expression));
}

function error(line, message) {
  if (line instanceof Token) {
    const token = line;
    if (token.type === TokenType.EOF) {
      report(token.line, " at end", message);
    } else {
      report(token.line, ` at '${token.lexeme}'`, message);
    }
  } else {
    report(lineOrToken, "", message);
  }
}

function report(line, where, message) {
  console.error(`[line ${line}] Error${where}: ${message}`);
  hadError = true;
}

main();