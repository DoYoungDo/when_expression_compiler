enum SyntaxKind {
    IDENTIFIER = "IDENTIFIER",                                                  // 标识符
    // 字面量值
    NUMBER = "NUMBER",                                                          // 数字
    STRING = "STRING",                                                          // 字符串
    REG_EXPRESSTION = "REG_EXPRESSTION",                                        // 正则表达式
    // 括号
    BRACKET_LEFT = "BRACKET_LEFT",                                              // 左括号
    BRACKET_RIGHT = "BRACKET_RIGHT",                                            // 右括号
    // 操作符
    OPERATOR_NOT = "OPERATOR_NOT",                                              // 非
    OPERATOR_AND = "OPERATOR_AND",                                              // 与
    OPERATOR_OR = "OPERATOR_OR",                                                // 或
    OPERATOR_EQUALITY = "OPERATOR_EQUALITY",                                    // 相等
    OPERATOR_INQUALITY = "OPERATOR_INQUALITY",                                  // 不相等
    OPERATOR_GREATER_THAN = "OPERATOR_GREATER_THAN",                            // 大于
    OPERATOR_GREATER_THAN_OR_EQUALITY = "OPERATOR_GREATER_THAN_OR_EQUALITY",    // 大于等于
    OPERATOR_LESS_THEN = "OPERATOR_LESS_THEN",                                  // 小于
    OPERATOR_LESS_THEN_OR_EQUALITY = "OPERATOR_LESS_THEN_OR_EQUALITY",          // 小于等于
    OPERATOR_MATCHES = "OPERATOR_MATCHES",                                      // 匹配
    OPERATOR_IN = "KEY_WORD_IN",                                                // 包含
    OPERATOR_NOT_IN = "OPERATOR_NOT_IN",                                        // 不包含
}

// 词法单元
export interface Token {
    readonly kind: SyntaxKind // 词法单元类型
    text: string // 词法单元文本
    // 还可以存储其它信息，如位置信息
}

class PositionError extends Error{
    constructor(public position: number, text: string, message: string) {
        let messageText = [message];
        messageText.push(text);
        messageText.push(" ".repeat(position) + "^");
        super(messageText.join("\n"));
    }
}
class RangeError extends Error{
    constructor(text: string, message: string) {
        let messageText = [message];
        messageText.push(text);
        messageText.push("^".repeat(text.length));
        super(messageText.join("\n"));
    }
}

// 自定义上下文类型基类，默认实现了操作符的运算逻辑，子类需要实现上下文的数据提供，或重新实现运算符的运算逻辑
export abstract class Context{
    abstract evlExp(expression:string):any
    evlOp(operator: string, left: any, right: any): any {
        switch (operator) {
            case "==":
            case "===": return left === right;
            case "!=": 
            case "!==": return left !== right;
            case ">": return left > right;
            case ">=": return left >= right;
            case "<": return left < right;
            case "<=": return left <= right;
            case "in": return Array.isArray(right) && right.includes(left);
            case "not in": return Array.isArray(right) && !right.includes(left);
            case "=~": return new RegExp(right).test(left);
            case "&&": return left && right;
            case "||": return left || right;
            default: throw new Error(`Unknown operator: ${operator}`);
        }
    }
}

// 词法扫描器
export function tokenizer(input: string): Token[] {
    let current = 0; // 当前字符指示器
    let tokens: Token[] = []; // 收集的词法单元集合
    let regSpace = /\s/; // 跳过空白字符的正则匹配表达式
    let regIdentifier = /[a-zA-Z\d_]/; // 匹配标识符的正则匹配表达式

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
                if(nextNextChar === "="){
                    tokens.push({
                        kind: SyntaxKind.OPERATOR_INQUALITY,
                        text: `${char}${nextChar}${nextNextChar}`
                    })
                    ++current;
                    continue;
                }

                tokens.push({
                    kind: SyntaxKind.OPERATOR_INQUALITY,
                    text: `${char}${nextChar}`
                })
                continue;
            }

            tokens.push({
                kind: SyntaxKind.OPERATOR_NOT,
                text: char
            })
            continue;
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
            if(nextChar === "="){
                tokens.push({
                    kind: SyntaxKind.OPERATOR_LESS_THEN_OR_EQUALITY,
                    text:  `${char}${nextChar}`,
                })
                ++current;
                continue;
            }

            tokens.push({
                kind: SyntaxKind.OPERATOR_LESS_THEN,
                text: char,
            })
            continue;
        }
        else if (char === ">") {
            let nextChar = input[++current];
            if(nextChar === "="){
                tokens.push({
                    kind: SyntaxKind.OPERATOR_GREATER_THAN_OR_EQUALITY,
                    text:  `${char}${nextChar}`,
                })
                ++current;
                continue;
            }

            tokens.push({
                kind: SyntaxKind.OPERATOR_GREATER_THAN,
                text: char,
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
        else if (regIdentifier.test(char)) {
            let value = char, nextChar = char;
            let pos = current;
            
            while (++current < input.length && (regIdentifier.test(nextChar = input[current]) || /\./.test(nextChar))) {
                value += nextChar;
            }
            
            if (/^\d+.?\d*$/.test(value)) {
                tokens.push({
                    kind: SyntaxKind.NUMBER,
                    text: value
                });
                continue;
            }

            if (/^[a-zA-Z_][a-zA-Z_\d]*$/.test(value)) {
                if ("in" === value) {
                    let lastToken = tokens[tokens.length - 1];
                    if (lastToken.kind === SyntaxKind.IDENTIFIER && lastToken.text === "not") {
                        tokens.pop();
                        tokens.push({
                            kind: SyntaxKind.OPERATOR_NOT_IN,
                            text: `${lastToken.text} ${value}`
                        })
                    }
                    else {
                        tokens.push({
                            kind: SyntaxKind.OPERATOR_IN,
                            text: value
                        })
                    }
                    continue;
                }

                tokens.push({
                    kind: SyntaxKind.IDENTIFIER,
                    text: value
                })
                continue;
            }

            throw new RangeError(input, "invalid identifier: " + value);
        }
        else{
            throw new PositionError(current, input, "unexpected character '" + char + "'")
        }
    }

    return tokens;
}

// 求值器
export function evaluate(tokens: Token[], context: Context): boolean {
    return evalRPN(toRPN(tokens), context);

    // 将中缀表达式转换为后缀表达式（RPN）xxx == yyy => xxx yyy ==
    function toRPN(tokens: Token[]): Token[] {
        // 定义各类运算符的优先级，数值越大优先级越高
        const OPERATOR_PRECEDENCE: Record<string, number> = {
            [SyntaxKind.OPERATOR_NOT]: 4,
            [SyntaxKind.OPERATOR_EQUALITY]: 3,
            [SyntaxKind.OPERATOR_INQUALITY]: 3,
            [SyntaxKind.OPERATOR_GREATER_THAN]: 3,
            [SyntaxKind.OPERATOR_GREATER_THAN_OR_EQUALITY]: 3,
            [SyntaxKind.OPERATOR_LESS_THEN]: 3,
            [SyntaxKind.OPERATOR_LESS_THEN_OR_EQUALITY]: 3,
            [SyntaxKind.OPERATOR_MATCHES]: 3,
            [SyntaxKind.OPERATOR_IN]: 3,
            [SyntaxKind.OPERATOR_NOT_IN]: 3,
            [SyntaxKind.OPERATOR_AND]: 2,
            [SyntaxKind.OPERATOR_OR]: 1,
        };

        const output: Token[] = [];
        const operatorStack: Token[] = [];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

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
        // 判断是否是运算符
        const isBinaryOperator = (kind: SyntaxKind) => [
            SyntaxKind.OPERATOR_EQUALITY,
            SyntaxKind.OPERATOR_INQUALITY,
            SyntaxKind.OPERATOR_GREATER_THAN,
            SyntaxKind.OPERATOR_GREATER_THAN_OR_EQUALITY,
            SyntaxKind.OPERATOR_LESS_THEN,
            SyntaxKind.OPERATOR_LESS_THEN_OR_EQUALITY,
            SyntaxKind.OPERATOR_MATCHES,
            SyntaxKind.OPERATOR_IN,
            SyntaxKind.OPERATOR_NOT_IN,
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
                stack.push(!stack.pop());
            }
            // 二元运算符
            else if (isBinaryOperator(token.kind)) {
                let right = stack.pop();
                let left = stack.pop();

                const result = context.evlOp(token.text, left, right);
                stack.push(result);
            }
        }

        return !!stack[0];
    }
}

export class Expression{
    constructor(private input: string) {}

    eval(context:Context):boolean{
        const tokens = tokenizer(this.input);
        return evaluate(tokens, context);
    }

    static eval(input: string, context: Context): boolean {
        const tokens = tokenizer(input);
        return evaluate(tokens, context);
    }
}