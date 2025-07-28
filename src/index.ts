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
export interface Token {
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
                text:`${char}${include ? nextChar : ""}`,
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
                text:`${char}${include ? nextChar : ""}`,
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
                else{
                    --current;
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

                    else {
                        --current;
                    }
                }
                else {
                    --current;
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

// 主入口：中缀 => 后缀 => 求值
export function evl(tokens: Token[], context: Context): boolean {
    const rpn = toRPN(tokens);
    return evalRPN(rpn, context);

    // 将中缀表达式转换为后缀表达式（RPN）
    function toRPN(tokens: Token[]): Token[] {
        // 定义各类运算符的优先级，数值越大优先级越高
        const OPERATOR_PRECEDENCE: Record<string, number> = {
            [SyntaxKind.OPERATOR_NOT]: 4,
            [SyntaxKind.OPERATOR_EQUALITY]: 3,
            [SyntaxKind.OPERATOR_INQUALITY]: 3,
            [SyntaxKind.OPERATOR_GREATER_THAN]: 3,
            [SyntaxKind.OPERATOR_LESS_THEN]: 3,
            [SyntaxKind.OPERATOR_MATCHES]: 3,
            [SyntaxKind.KEY_WORD_IN]: 3,
            [SyntaxKind.KEY_WORD_NOT]: 3, // 实际处理为 not in
            [SyntaxKind.OPERATOR_AND]: 2,
            [SyntaxKind.OPERATOR_OR]: 1,
        };

        const output: Token[] = [];
        const operatorStack: Token[] = [];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            // 合并 not + in 为 not in
            if (token.kind === SyntaxKind.KEY_WORD_NOT && tokens[i + 1]?.kind === SyntaxKind.KEY_WORD_IN) {
                operatorStack.push({ kind: SyntaxKind.KEY_WORD_NOT, text: "not in" });
                i++; // 跳过 'in'
                continue;
            }

            switch (token.kind) {
                case SyntaxKind.IDENTIFIER:
                case SyntaxKind.STRING:
                case SyntaxKind.NUMBER:
                case SyntaxKind.REG_EXPRESSTION:
                    output.push(token);
                    break;
                case SyntaxKind.BRACKET_LEFT:
                    operatorStack.push(token);
                    break;
                case SyntaxKind.BRACKET_RIGHT:
                    while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].kind !== SyntaxKind.BRACKET_LEFT) {
                        output.push(operatorStack.pop()!);
                    }
                    operatorStack.pop(); // 弹出左括号
                    break;
                default:
                    while (
                        operatorStack.length > 0 &&
                        OPERATOR_PRECEDENCE[operatorStack[operatorStack.length - 1].kind] >= OPERATOR_PRECEDENCE[token.kind]
                    ) {
                        output.push(operatorStack.pop()!);
                    }
                    operatorStack.push(token);
            }
        }

        while (operatorStack.length > 0) {
            output.push(operatorStack.pop()!);
        }
        return output;
    }

    // 执行后缀表达式求值
    function evalRPN(rpn: Token[], context: Context): boolean {

        // 判断是否是二元运算符
        const isBinaryOperator = (kind: SyntaxKind) => [
            SyntaxKind.OPERATOR_EQUALITY,
            SyntaxKind.OPERATOR_INQUALITY,
            SyntaxKind.OPERATOR_GREATER_THAN,
            SyntaxKind.OPERATOR_LESS_THEN,
            SyntaxKind.OPERATOR_MATCHES,
            SyntaxKind.KEY_WORD_IN,
            SyntaxKind.KEY_WORD_NOT,
            SyntaxKind.OPERATOR_AND,
            SyntaxKind.OPERATOR_OR,
        ].includes(kind);

        // 判断是否是单目运算符
        const isUnaryOperator = (kind: SyntaxKind) => kind === SyntaxKind.OPERATOR_NOT;

        const stack: any[] = [];

        for (const token of rpn) {
            // 获取变量值
            if ([SyntaxKind.IDENTIFIER].includes(token.kind)) {
                stack.push(context.evlExp(token.text));
            }
            // 常量：string/number/regex 直接 eval
            else if ([SyntaxKind.STRING, SyntaxKind.REG_EXPRESSTION].includes(token.kind)) {
                stack.push(token.text);
            }
            else if ([SyntaxKind.NUMBER].includes(token.kind)) {
                stack.push(Number(token.text));
            }
            // 逻辑非
            else if (isUnaryOperator(token.kind)) {
                const value = stack.pop();
                stack.push(!value);
            }
            // 二元运算符
            else if (isBinaryOperator(token.kind)) {
                let right = stack.pop();
                let left = stack.pop();

                const result = context.evlOp(token.text, left, right);
                stack.push(result);
            }
        }

        return Boolean(stack[0]);
        
    }
}
