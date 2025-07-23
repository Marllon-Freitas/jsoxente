# jsoxente

A JavaScript interpreter for the "Oxente" scripting language.

This project is a personal study of interpreter architecture. Its structure and implementation are based on the concepts presented in the first interpreter, `jlox`, from Robert Nystrom's book, "Crafting Interpreters".

## Project Status

🚧 **In Development...** 🚧

The language is now **Turing-complete** and features a set of control flow statements, including conditionals (`if-else`), loops (`for`, `while`), and loop control (`break`).

The current implementation includes:

* A **Scanner (Lexer)** that breaks the source code into a stream of tokens.
* A **Parser** that builds an **Abstract Syntax Tree (AST)**, correctly handling precedence and error recovery.
* An **Interpreter** that walks the AST to execute statements and evaluate expressions, managing state across nested scopes.

## 📚 Primary Source

All concepts and the learning structure are based on the following work:

  * **Book:** *Crafting Interpreters*
  * **Author:** Robert Nystrom
  * **Official Website:** [craftinginterpreters.com](https://craftinginterpreters.com/)

The full text of the book is generously made available online by the author for free reading.
