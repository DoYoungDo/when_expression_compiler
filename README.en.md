[中文](README.md)


# When Expression Compiler

This is a simple When expression compiler project with fewer than 500 lines of code (including test code), used to interpret and execute VS Code `when` expressions.

> [VS Code when expression specification](https://code.visualstudio.com/api/references/when-clause-contexts)

## Try Online

Open the [When Expression Laboratory](https://doyoungdo.github.io/when_expression_compiler) to explore how an interpreter works interactively, with no installation required.

1. Choose a built-in example or enter your own `when` expression and configure its context variables.
2. Use the next-action control in the Tokens, RPN conversion, and evaluation stack panels to follow character scanning, operator precedence, and evaluation step by step.
3. Try the error examples to see how failures are detected during tokenization, syntax validation, or evaluation. The interface is currently in Chinese.

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

## Contribution

Welcome to submit Pull Request or report issues. Please follow the project's coding guidelines and ensure tests are passed.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
