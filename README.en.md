[中文](README.md)


# When Expression Compiler

This is a small TypeScript project for learning how to build a simple interpreter by evaluating VS Code `when` expressions.

> [VS Code when expression specification](https://code.visualstudio.com/api/references/when-clause-contexts)

## Project Structure

- `src/index.ts`: Definition of core types and error classes
- `src/test.ts`: Test cases for verifying the parsing results of `when` expressions
- Other configuration files such as `package.json` and `tsconfig.json` are used for project management and build configuration

## Usage

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build:
   ```bash
   npm run build
   ```

3. Run tests:
   ```bash
   npm run test
   ```

## Syntax Validation

Tokenization recognizes tokens; RPN conversion validates operand, operator, and parenthesis order.
For example, `editorLangId == 'typescript && ' isMac` has balanced quotes but lacks an operator between the string and `isMac`. It throws `SyntaxError` before reading the context or evaluating values.
Adjacent operands, missing operands, empty parentheses, and unmatched parentheses are rejected. Empty expressions still return `false`.
`npm test` asserts results and syntax failures, exiting with a nonzero status on failure.
The HTML teaching prototype has a separate browser implementation. Parsing changes must be checked in both implementations; it does not directly call `src/index.ts`.

## Contribution

Welcome to submit Pull Request or report issues. Please follow the project's coding guidelines and ensure tests are passed.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
