enum SyntaxKind {
    IDENTIFIER = "IDENTIFIER",

    NUMBER = "NUMBER",
    STRING = "STRING",
    REG_EXPRESSTION = "REG_EXPRESSTION",

    BRACKET_LEFT = "BRACKET_LEFT",
    BRACKET_RIGHT = "BRACKET_RIGHT",

    OPERATOR_NOT = "OPERATOR_NOT",
    OPERATOR_AND = "OPERATOR_AND",
    OPERATOR_OR = "OPERATOR_OR",
    OPERATOR_EQUALITY = "OPERATOR_EQUALITY",
    OPERATOR_INQUALITY = "OPERATOR_INQUALITY",
    OPERATOR_GREATER_THAN = "OPERATOR_GREATER_THAN",
    OPERATOR_LESS_THEN = "OPERATOR_LESS_THEN",
    OPERATOR_MATCHES = "OPERATOR_MATCHES",
    KEY_WORD_IN = "KEY_WORD_IN",
    KEY_WORD_NOT = "KEY_WORD_NOT",
}
interface Token {
    readonly kind: SyntaxKind
    text: string
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

class TokenError extends Error{
    constructor(public token:Token, message: string) {
        let text = [message];
        text.push(`    ${token.text}    `);
        text.push(" ".repeat(4) + "^");
        
        super(text.join("\n"));
    }
}

export interface Context{
    evlExp(expression:String):any
    evlOp(operator:String, left:any, right:any):any
}

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
                text: char
            });
            current++;
            continue;
        }
        else if (char === ")") {
            tokens.push({
                kind: SyntaxKind.BRACKET_RIGHT,
                text: char
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
                    text: char
                })
                ++current;
                continue;
            }
            else{
                tokens.push({
                    kind: SyntaxKind.OPERATOR_NOT,
                    text: char
                })
                continue;
            }

        }
        else if (char === "|") {
            let nextChar = input[++current];
            if (nextChar === "|") {
                tokens.push({
                    kind: SyntaxKind.OPERATOR_OR,
                    text: "||"
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
                    text: "&&"
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
                let text = "===";
                let nextNextChar = input[++current];
                if(nextNextChar !== "="){
                    --current;
                    text = "=="
                }

                tokens.push({
                    kind: SyntaxKind.OPERATOR_EQUALITY,
                    text
                })
                ++current;
                continue;
            }
            else if(nextChar === "~"){
                tokens.push({
                    kind: SyntaxKind.OPERATOR_MATCHES,
                    text: "=~"
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
                text:`${char}${nextChar}`,
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
                text:`${char}${nextChar}`,
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
                text: value
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
                text: value
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
                text: value
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
                            text: "in"
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
                            text: "not"
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
                text: value
            })
            continue;
        }
        else{
            throw new PositionError(current, input, "unexpected character '" + char + "'")
        }
    }

    return tokens;
}

export function evl(tokens: Token[], context: Context): boolean {
    let current = 0;
    let opStack:string[] = [];
    let valueStack: any[] = [];
    while (current < tokens.length) {
        let token = tokens[current];
        if(token.kind === SyntaxKind.IDENTIFIER){
            let nextToken = tokens[++current];
            if(!isOp(nextToken)){
                throw new TokenError(nextToken, "expected operator")
            }

            valueStack.push(context.evlExp(token.text));
            continue;
        }
        else if(isOp(token)){
            if(valueStack.length < 1){
                throw new TokenError(token, "unexpected operator")
            }

            let tokenText = token.text;
            let nextToken = tokens[++current];
            do {
                if (isOp(nextToken)) {
                    if (token.kind === SyntaxKind.KEY_WORD_NOT && nextToken.kind === SyntaxKind.KEY_WORD_IN) {
                        tokenText = "not in";
                        nextToken = tokens[++current];
                        break;
                    }
                    throw new TokenError(nextToken, "unexpected operator")
                }
            } while (0);

            if(nextToken.kind === SyntaxKind.STRING || nextToken.kind === SyntaxKind.NUMBER || nextToken.kind === SyntaxKind.REG_EXPRESSTION){
                valueStack.push(context.evlOp(tokenText, valueStack.pop(), nextToken.text))
                ++current;
                continue;
            }
            else if(nextToken.kind === SyntaxKind.IDENTIFIER){
                valueStack.push(context.evlOp(tokenText, valueStack.pop(), context.evlExp(nextToken.text)))
                ++current;
                continue;
            }

        }
    }

    function isOp(token:Token){
        return token.kind === SyntaxKind.OPERATOR_NOT ||
            token.kind === SyntaxKind.OPERATOR_AND ||
            token.kind === SyntaxKind.OPERATOR_OR ||
            token.kind === SyntaxKind.OPERATOR_EQUALITY ||
            token.kind === SyntaxKind.OPERATOR_INQUALITY ||
            token.kind === SyntaxKind.OPERATOR_GREATER_THAN ||
            token.kind === SyntaxKind.OPERATOR_LESS_THEN ||
            token.kind === SyntaxKind.OPERATOR_MATCHES ||
            token.kind === SyntaxKind.KEY_WORD_IN ||
            token.kind === SyntaxKind.KEY_WORD_NOT;
    }

    return valueStack.length > 0 ? valueStack[0] : false;
}