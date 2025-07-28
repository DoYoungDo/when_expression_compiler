

# When Expression Compiler

This is a simple When Expression Compiler project used to parse and validate `when` expressions with a specific syntax.

## Features

- Defines syntax types (`SyntaxKind`)
- Provides `PositionError` and `TokenError` classes for error handling
- Includes test cases to verify the correctness of expression parsing

## Project Structure

- `src/index.ts`: Core type and error class definitions
- `src/test.ts`: Test cases used to validate the parsing results of `when` expressions
- Other configuration files such as `package.json`, `tsconfig.json`, etc., for project management and build configuration

## Usage

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run tests:
   ```bash
   npm test
   ```

## Contribution

Pull requests and issue reports are welcome. Please follow the project's coding standards and ensure all tests pass.

## License

This project follows the MIT License. For details, please see the `LICENSE` file.