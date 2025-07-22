enum SyntaxKind {
    IDENTIFIER = "IDENTIFIER",
    NUMBER = "NUMBER",
    STRING = "STRING",
    OPERATOR_NOT = "OPERATOR_NOT",
    OPERATOR_AND = "OPERATOR_AND",
    OPERATOR_OR = "OPERATOR_OR",
    OPERATOR_EQUALITY = "OPERATOR_EQUALITY",
    OPERATOR_INQUALITY = "OPERATOR_INQUALITY",
    OPERATOR_GREATER_THAN = "OPERATOR_GREATER_THAN",
    OPERATOR_LESS_THEN = "OPERATOR_LESS_THEN",
    OPERATOR_MATCHES = "OPERATOR_MATCHES",
    BRACKET_LEFT = "BRACKET_LEFT",
    BRACKET_RIGHT = "BRACKET_RIGHT",
    REG_EXPRESSTION = "REG_EXPRESSTION",
    KEY_WORD_IN = "KEY_WORD_IN",
    KEY_WORD_NOT = "KEY_WORD_NOT",
    END = "END"
}
interface Token {
    readonly kind: SyntaxKind
    value?: string
    [v: string]: any
}

class PositionError extends Error{
    constructor(public position: number, text: string, message: string) {
        let messageText = [message];
        messageText.push(text);
        messageText.push(" ".repeat(position) + "^");
        super(messageText.join("\n"));
    }
}

// enum SemanticKind{
//     STATEMENT,
//     EXPRESSION
// }

// interface Node{
//     kind: SemanticKind
// }

// interface Statement extends Node{
//     kind: SemanticKind.STATEMENT
//     expression: Expression
// }

// interface Expression extends Node{
//     kind: SemanticKind.EXPRESSION
// }

export function tokenizer(input: string): Token[] {
    let current = 0;
    let tokens: Token[] = [];
    let regSpace = /\s/;
    let regNum = /\d/;
    let regLetter = /[a-zA-Z]/;

    main: while (current < input.length) {
        let char = input[current];
        if (regSpace.test(char)) {
            current++;
            continue;
        }
        else if (char === "(") {
            tokens.push({
                kind: SyntaxKind.BRACKET_LEFT,
                value: char
            });
            current++;
            continue;
        }
        else if (char === ")") {
            tokens.push({
                kind: SyntaxKind.BRACKET_RIGHT,
                value: char
            })
            current++;
            continue;
        }
        else if (char === "!") {
            let nextChar = input[++current];
            if(nextChar === "="){
                let nextNextChar = input[++current];
                if(nextNextChar !== "="){
                    --current;
                }
                tokens.push({
                    kind: SyntaxKind.OPERATOR_INQUALITY,
                })
                ++current;
                continue;
            }
            else{
                tokens.push({
                    kind: SyntaxKind.OPERATOR_NOT,
                })
                continue;
            }

        }
        else if (char === "|") {
            let nextChar = input[++current];
            if (nextChar === "|") {
                tokens.push({
                    kind: SyntaxKind.OPERATOR_OR,
                })
                ++current;
                continue;
            }
            else {
                throw new PositionError(current, input, "| must be followed by |")
            }
        }
        else if (char === "&") {
            let nextChar = input[++current];
            if (nextChar === "&") {
                tokens.push({
                    kind: SyntaxKind.OPERATOR_AND,
                })
                ++current;
                continue;
            }
            else {
                throw new PositionError(current, input, "& must be followed by &")
            }
        }
        else if (char === "=") {
            let nextChar = input[++current];
            if (nextChar === "=") {
                let nextNextChar = input[++current];
                if(nextNextChar !== "="){
                    --current;
                }

                tokens.push({
                    kind: SyntaxKind.OPERATOR_EQUALITY,
                })
                ++current;
                continue;
            }
            else if(nextChar === "~"){
                tokens.push({
                    kind: SyntaxKind.OPERATOR_MATCHES,
                })
                ++current;
                continue;
            }
            else {
                throw new PositionError(current, input, "unexpected character '='")
            }
        }
        else if (char === "<") {
            let nextChar = input[++current];
            let include = false;
            if(nextChar === "="){
                include = true;
                ++current;
            }

            tokens.push({
                kind: SyntaxKind.OPERATOR_LESS_THEN,
                value:`${char}${nextChar}`,
                include
            })
            continue;
        }
        else if (char === ">") {
            let nextChar = input[++current];
            let include = false;
            if(nextChar === "="){
                include = true;
                ++current;
            }

            tokens.push({
                kind: SyntaxKind.OPERATOR_GREATER_THAN,
                value:`${char}${nextChar}`,
                include
            })
            continue;
        }
        else if (char === "'") {
            let value = "";
            let nextChar = input[++current];
            while(nextChar !== "'" && current < input.length){
                value += nextChar;
                nextChar = input[++current];
            }

            if(nextChar !== "'"){
                throw new PositionError(current, input, "expected character '''")
            }

            tokens.push({
                kind: SyntaxKind.STRING,
                value
            })
            ++current;
            continue;
        }
        else if (char === "/") {
            let value = "";
            let nextChar = input[++current];
            while(nextChar !== "/" && current < input.length){
                value += nextChar;
                nextChar = input[++current];
            }

            if(nextChar !== "/"){
                throw new PositionError(current, input, "expected character '/'")
            }

            tokens.push({
                kind: SyntaxKind.REG_EXPRESSTION,
                value
            })
            ++current;
            continue;
        }
        else if (regNum.test(char)) {
            let value = char;
            let nextChar = input[++current];

            while((regNum.test(nextChar) || /\./.test(nextChar)) && current < input.length){
                value += nextChar;
                nextChar = input[++current];
            }

            if(!/^\d+.?\d*$/.test(value)){
                throw new PositionError(current, input, "invalid number:" + value);
            }

            tokens.push({
                kind: SyntaxKind.NUMBER,
                value
            });
            continue;
        }
        else if (regLetter.test(char)) {
            if(char === "i"){
                let nextChar = input[++current];
                if(nextChar === "n"){
                    let nextNextChar = input[++current];
                    if (regSpace.test(nextNextChar)) {
                        tokens.push({
                            kind: SyntaxKind.KEY_WORD_IN,
                        })

                        ++current;
                        continue main;
                    }
                }
            }
            else if (char === "n") {
                let nextChar = input[++current];
                if (nextChar === "o") {
                    let nextNextChar = input[++current];
                    if (nextNextChar === "t") {
                        tokens.push({
                            kind: SyntaxKind.KEY_WORD_NOT,
                        })

                        ++current;
                        continue main;
                    }
                }
            }

            let value = char;
            let nextChar = input[++current];
            while(regLetter.test(nextChar) && current < input.length){
                value += nextChar;

                nextChar = input[++current];
            }

            tokens.push({
                kind: SyntaxKind.IDENTIFIER,
                value
            })
            continue;
        }
        else{
            throw new PositionError(current, input, "unexpected character '" + char + "'")
        }
    }

    tokens.push({
        kind: SyntaxKind.END,
    })

    return tokens;
}

// export function parser(tokens: Token[]): Statement {
//     let statement:Statement = {
//         kind: SemanticKind.STATEMENT,
//     }
//     return statement;
// }