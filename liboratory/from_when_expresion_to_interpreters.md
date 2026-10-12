# 从 VS Code 的 when 表达式理解解释器的基本原理

> 本文基于开源项目 [when_expression_compiler](https://github.com/DoYoungDo/when_expression_compiler)，全部核心代码都在 [`src/index.ts`](../src/index.ts) 中（含测试不到 500 行）。
> 你也可以打开 [When 表达式实验室](https://doyoungdo.github.io/when_expression_compiler)，在网页中逐个动作地观察本文描述的每个阶段。

提到"解释器"或"编译原理"，很多人的第一反应是龙书、词法文法、抽象语法树……感觉是一个庞大的话题。但如果把目标缩小到一个**只做布尔判断的小语言**，完整流程其实可以在几百行内讲清楚。VS Code 的 `when` 表达式就是一个绝佳的入门样本：它足够小（没有函数、没有赋值、没有循环），又足够真实（每天有成千上万次求值发生在你的编辑器里）。

## when表达式是什么

VS Code 中大量行为是靠条件控制的：快捷键在什么状态下生效、菜单项在什么时候显示、某个视图是否可见。这些条件就是 `when` 子句。比如在 `keybindings.json` 中：

```jsonc
{
    "key": "ctrl+alt+f",
    "command": "editor.action.formatDocument",
    "when": "editorTextFocus && !editorReadonly"
}
```

这个快捷键只在"编辑器获得焦点且不是只读模式"时生效。类似的条件还出现在菜单可见性、状态栏命令、扩展激活等场景。

`when` 表达式的本质是：**一个返回布尔值的表达式**。

- 变量（如 `editorTextFocus`、`isMac`）由编辑器在运行时提供，称为上下文键（context key）；
- 字面量支持字符串、数字和正则；
- 运算符包括逻辑、比较和集合判断。

我们的目标，就是写一个程序：输入 `"editorTextFocus && !editorReadonly"` 这样的字符串和一份变量表，输出 `true` 或 `false`。

## when表达式的基本语法

先约定要支持的语法。变量就是标识符，字面量有三种写法：

| 类型 | 示例 | 说明 |
|---|---|---|
| 字符串 | `'typescript'` | 用单引号包裹 |
| 数字 | `0`、`1.5` | 非负整数或小数 |
| 正则 | `/file/` | 用斜杠包裹，不含 flags |

运算符按优先级从高到低排列：

| 优先级 | 运算符 | 说明 |
|---|---|---|
| 4（最高） | `!` | 逻辑非 |
| 3 | `==` `===` | 相等比较 |
| 3 | `!=` `!==` | 不相等比较 |
| 3 | `>` `>=` `<` `<=` | 大小比较 |
| 3 | `=~` | 正则匹配，左侧是被匹配的字符串 |
| 3 | `in` / `not in` | 左侧是否在右侧数组中 |
| 2 | `&&` | 逻辑与 |
| 1（最低） | `\|\|` | 逻辑或 |

括号可以改变优先级。几个真实感的例子：

```text
isMac
editorLangId == 'typescript'
resourceFilename not in supportedFolders
resourceScheme =~ /file/
workspaceFolderCount > 0 && (gitOpenRepositoryCount > 1 || isWin)
```

两点实现上的取舍，先在这里说明：

1. 本实现中 `==` 与 `===` 都按严格相等处理（`!=` 与 `!==` 同理），不做隐式类型转换；
2. `in` / `not in` 的右侧必须是数组，否则直接按 `false` 处理。

## 实现一个简单的when表达式解释器

整个解释器是一条三段流水线：

```text
"editorLangId == 'typescript' && isMac"
        │  tokenizer：字符流 → Token 流
        ▼
[editorLangId] [==] ['typescript'] [&&] [isMac]
        │  toRPN：中缀 → 后缀
        ▼
editorLangId 'typescript' == isMac &&
        │  evalRPN：栈式求值
        ▼
true
```

三个阶段各自只做一件事，变量怎么取值、运算符怎么计算则交给调用方通过 `Context` 注入——这是全文最重要的一条边界，后面会反复出现。

> 下文代码为保证清晰做了精简（省略指针推进、错误分支等细节），每一段的完整实现见 [`src/index.ts`](../src/index.ts)。

### 词法扫描器

词法扫描器（tokenizer）负责把字符串拆成最小的语法单元，只关心"每个词是否合法"，不关心词与词之间的组合关系。

先定义 Token 的类型和结构：

```ts
// Token 的类别：这门语言里一共只有四种东西——变量、字面量、括号、运算符
enum SyntaxKind {
    IDENTIFIER, NUMBER, STRING, REG_EXPRESSTION,   // 变量 / 数字 / 字符串 / 正则
    BRACKET_LEFT, BRACKET_RIGHT,                   // 左括号 / 右括号
    OPERATOR_NOT, OPERATOR_AND, OPERATOR_OR,       // ! / && / ||
    OPERATOR_EQUALITY, OPERATOR_INQUALITY,         // == === / != !==
    OPERATOR_IN, OPERATOR_NOT_IN,                  // in / not in
    // ……比较、正则匹配等运算符同理，完整定义见源码
}

// 一个 Token = 类别 + 文本
interface Token {
    readonly kind: SyntaxKind;
    text: string;
}
```

扫描器是一个单指针循环，从左到右逐字符处理：

```ts
// 词法扫描器：一个指针从左到右移动，给每个片段分类
export function tokenizer(input: string): Token[] {
    let current = 0;              // 当前读到的下标
    let tokens: Token[] = [];     // 扫描结果

    while (current < input.length) {
        const char = input[current];

        if (/\s/.test(char)) { current++; continue; }   // 空白不构成 Token，直接跳过

        // 其余按首字符分流：' → 字符串、/ → 正则、
        // 字母数字 → 变量或数字、括号和运算符各自处理（下面展开关键分支）
    }

    return tokens;
}
```

**关键点一：运算符要向前多看一个字符。** 同一个 `!`，后面跟 `=` 就是 `!=`，否则才是逻辑非：

```ts
// 以 ! 为例：先偷看下一个字符，才能确定它是谁
const next = input[++current];                                        // 向前看一个字符

if (next === "=") {
    tokens.push({ kind: SyntaxKind.OPERATOR_INQUALITY, text: "!=" }); // 组合成 !=（!== 再多看一位，同理）
} else {
    tokens.push({ kind: SyntaxKind.OPERATOR_NOT, text: "!" });        // 只是单纯的逻辑非
}
```

`==` / `===`、`>=`、`&&`、`||` 的处理方式完全相同，都是"读到首字符后再看一位"。

**关键点二：字面量的扫描是"找配对"。** 字符串从起始引号开始，读到下一个 `'` 为止（正则同理，配对的字符是 `/`）：

```ts
// 字符串字面量：从起始引号开始，读到配对的结束引号为止
let value = "";
while (input[++current] !== "'") {
    value += input[current];        // 引号之间的字符都是内容（包括空格）
}

tokens.push({ kind: SyntaxKind.STRING, text: value });   // 注意：引号本身不进入 Token 文本
// 如果一路读到末尾也没等到结束引号 → 抛出 PositionError，见关键点三
```

**关键点三：错误信息要能定位。** 词法错误最怕只说一句"语法错误"。`PositionError` 会在原始输入下方打一个 `^` 指针：

```ts
// 带位置的错误：错误原因 + 原始输入 + 一行 ^ 指针（指向出错的列）
class PositionError extends Error {
    constructor(position: number, text: string, message: string) {
        super([message, text, " ".repeat(position) + "^"].join("\n"));
    }
}
```

对 `editorLangId == 'typescript` 报错时会输出：

```text
expected character '''
editorLangId == 'typescript
                           ^
```

**关键点四：标识符与关键字的区分。** 字母开头的词先完整读出，再判断它的身份：

```ts
// 变量和数字：把连续的字母、数字、下划线读成一个完整的词
let value = char;
while (/\w/.test(input[current + 1] ?? "")) {
    value += input[++current];
}

if (/^\d/.test(value)) {
    // 整个词都是数字 → 数字字面量
    tokens.push({ kind: SyntaxKind.NUMBER, text: value });
} else if (value === "in") {
    // in 是关键字：如果上一个 Token 恰好是 not，撤销它并合并成 not in
    const last = tokens[tokens.length - 1];
    if (last && last.text === "not") {
        tokens.pop();                                                        // 撤销刚才的 not
        tokens.push({ kind: SyntaxKind.OPERATOR_NOT_IN, text: "not in" });
    } else {
        tokens.push({ kind: SyntaxKind.OPERATOR_IN, text: value });          // 单独的 in
    }
} else {
    // 其它 → 普通变量名
    tokens.push({ kind: SyntaxKind.IDENTIFIER, text: value });
}
```

`not in` 的处理很有代表性：`not` 本身先被当成普通标识符读入，直到后面的 `in` 出现，才回溯一步把两个 Token 合并。这就是词法层面的"向前看"。

对示例表达式执行 `tokenizer`，得到：

```text
editorLangId   → IDENTIFIER
==             → OPERATOR_EQUALITY
'typescript'   → STRING（text 为 typescript）
&&             → OPERATOR_AND
isMac          → IDENTIFIER
```

### 中缀表达式转后缀表达式

人类书写习惯是中缀：`a == b && c`，运算符在两个操作数中间，配合优先级和括号消除歧义。但机器求值更喜欢**后缀表达式**（逆波兰式，RPN）：`a b == c &&`——运算符总在操作数后面，从左到右扫一遍、用一个栈就能算完，中途不需要再看优先级和括号。

两者的信息量等价，只是**优先级规则被编码的位置不同**：中缀靠运算符之间的比较来体现，后缀把它固化进了序列本身。所以转换阶段要替求值阶段做完所有优先级判断。

转换使用经典的调度场算法（Shunting-yard），规则只有四条：

1. 操作数 → 直接进入输出队列；
2. 运算符 → 先把栈中**优先级不低于它**的运算符全部弹出到输出，再把自己入栈；
3. `(` → 入栈充当边界；`)` → 连续弹栈直到遇见 `(`，两个括号本身都不进输出；
4. 输入结束 → 清空运算符栈。

先把优先级写成一个表，数值越大优先级越高：

```ts
// 优先级表：数值越大，优先级越高
// （同级运算符在源码中共用一个数值，这里做了合并展示）
const OPERATOR_PRECEDENCE: Record<string, number> = {
    [SyntaxKind.OPERATOR_NOT]: 4,       // !
    [SyntaxKind.OPERATOR_EQUALITY]: 3,  // == === != !== > >= < <= =~ in not in 同为 3 级
    [SyntaxKind.OPERATOR_AND]: 2,       // &&
    [SyntaxKind.OPERATOR_OR]: 1,        // ||
};
```

转换主循环，四条规则一一对应：

```ts
// 判断是否为操作数：变量和三种字面量
const isOperand = (t: Token) =>
    [SyntaxKind.IDENTIFIER, SyntaxKind.STRING, SyntaxKind.NUMBER, SyntaxKind.REG_EXPRESSTION].includes(t.kind);

for (const token of tokens) {
    if (isOperand(token)) {
        output.push(token);                     // 规则 1：操作数直接进入输出
    } else if (token.kind === SyntaxKind.BRACKET_LEFT) {
        operatorStack.push(token);              // 规则 3：左括号入栈，作为边界
    } else if (token.kind === SyntaxKind.BRACKET_RIGHT) {
        // 规则 3：右括号 → 弹栈直到配对的左括号；括号本身不进输出
        while (operatorStack.at(-1).kind !== SyntaxKind.BRACKET_LEFT) {
            output.push(operatorStack.pop()!);
        }
        operatorStack.pop();                    // 丢弃左括号
    } else {
        // 规则 2：先把优先级不低于自己的栈顶运算符弹出去，再让自己入栈
        while (operatorStack.length > 0 &&
               OPERATOR_PRECEDENCE[operatorStack.at(-1).kind] >= OPERATOR_PRECEDENCE[token.kind]) {
            output.push(operatorStack.pop()!);
        }
        operatorStack.push(token);
    }
}

while (operatorStack.length > 0) {              // 规则 4：输入结束，清空运算符栈
    output.push(operatorStack.pop()!);
}
```

逐步跟踪 `editorLangId == 'typescript' && isMac`：

| 当前 Token | 动作 | 输出队列 | 运算符栈 |
|---|---|---|---|
| `editorLangId` | 操作数 → 输出 | `editorLangId` | — |
| `==` | 栈空 → 入栈 | `editorLangId` | `==` |
| `'typescript'` | 操作数 → 输出 | `editorLangId 'typescript'` | `==` |
| `&&` | `==` 优先级(3) ≥ `&&`(2)，先弹出 `==`；`&&` 入栈 | `editorLangId 'typescript' ==` | `&&` |
| `isMac` | 操作数 → 输出 | `editorLangId 'typescript' == isMac` | `&&` |
| 结束 | 清空栈 | `editorLangId 'typescript' == isMac &&` | — |

最终输出就是合法的 RPN。注意第 4 步：`&&` 到来时，`==` 的两个操作数都已就位且优先级更高，所以 `==` 可以"提前完工"进入输出——**优先级比较就发生在这一刻**，之后求值阶段无需再关心。

括号的处理同理：`a && (b || c)` 会被转换成 `a b c || &&`，读者可以按上表自行推演一遍。

### 求值

RPN 求值只需要一个栈，规则比转换还简单：

- 遇到**值** → 压栈；
- 遇到一元 `!` → 弹出 1 个操作数，取反后压回；
- 遇到二元运算符 → **先弹右操作数，再弹左操作数**（顺序不能反），计算后把结果压回。

```ts
// 栈式求值：对 RPN 一遍扫描
function evalRPN(rpn: Token[], context: Context): boolean {
    const stack: any[] = [];

    for (const token of rpn) {
        if (isOperand(token)) {
            // 值 → 压栈。来源分三种：
            // 变量查上下文 / 数字转 Number / 字符串和正则直接用文本
            const value = token.kind === SyntaxKind.IDENTIFIER ? context.evlExp(token.text)
                        : token.kind === SyntaxKind.NUMBER     ? Number(token.text)
                        : token.text;
            stack.push(value);
        } else if (token.kind === SyntaxKind.OPERATOR_NOT) {
            stack.push(!stack.pop());               // 一元 ! → 弹 1 个，取反后压回
        } else {
            // 二元运算符：先弹右，再弹左，顺序不能反
            const right = stack.pop();
            const left  = stack.pop();
            stack.push(context.evlOp(token.text, left, right));   // 怎么算由 Context 决定
        }
    }

    return !!stack[0];                              // 栈中剩下的唯一结果 → 布尔值
}
```

注意：求值器**不知道** `editorLangId` 是什么值，也**不知道** `==` 该怎么算——这两件事都由调用方通过 `Context` 提供：

```ts
export abstract class Context {
    // 变量怎么取值：由调用方实现（真实场景是查编辑器状态，测试时查字典）
    abstract evlExp(name: string): any;

    // 运算符怎么计算：默认实现已经足够通用
    evlOp(operator: string, left: any, right: any): any {
        switch (operator) {
            case "==": case "===": return left === right;   // 严格相等
            case "!=": case "!==": return left !== right;
            case ">":  return left > right;                 // >= < <= 同理，见源码
            case "in":     return Array.isArray(right) && right.includes(left);   // right 必须是数组
            case "not in": return Array.isArray(right) && !right.includes(left);
            case "=~":     return new RegExp(right).test(left);                   // 用 left 匹配正则 right
            case "&&":     return left && right;
            case "||":     return left || right;
            default: throw new Error(`Unknown operator: ${operator}`);            // 未知运算符直接报错
        }
    }
}
```

这就是"解释器"与"具体业务"的分界线：**语法流程是通用的，语义是可以替换的**。测试代码只需要实现一个从字典取值的 `evlExp`，就能跑通全部用例：

```ts
// 测试用的最小 Context：变量就是一张字典
const context = new class extends Context {
    evlExp(name: string) {
        const ctx = { editorLangId: "typescript", isMac: true, supportedFolders: ["readme.md", "main.ts"] };
        return ctx[name] ?? false;      // 未知变量按 false 处理
    }
};
```

最后把示例完整走一遍：

| RPN Token | 动作 | 求值栈 |
|---|---|---|
| `editorLangId` | 上下文取值 → 压栈 | `'typescript'` |
| `'typescript'` | 字面量 → 压栈 | `'typescript'` `'typescript'` |
| `==` | 弹出右 `'typescript'`、左 `'typescript'`，严格相等 → `true` 压回 | `true` |
| `isMac` | 上下文取值 → 压栈 | `true` `true` |
| `&&` | 弹出两个操作数，求与 → `true` 压回 | `true` |

栈中只剩一个值，`!!stack[0]` 归一化为布尔后返回 `true`。末尾的 `!!` 还有一个作用：`&&` / `||` 沿用 JavaScript 语义会返回操作数本身（比如 `a && b` 在 `a` 为假时返回 `a`），归一化保证对外总是输出严格的 `boolean`。

## 总结

回头看，"能理解一段文本并算出结果"被拆成了三个互相独立的小问题：

1. **词法分析**：字符流 → Token 流，只关心单个词是否合法；
2. **中缀转后缀**：用调度场算法把优先级和括号编码进线性序列，优先级判断在转换时一次性完成；
3. **栈式求值**：对 RPN 一遍扫描，遇到运算符就消费栈顶的操作数。

再叠加一条架构边界：`Context` 把变量解析和运算符实现交给调用方，解释器本身只负责"流程"。

这套结构也是继续扩展的清晰路径：

- 新增运算符：加 Token 类型、优先级表项和 `evlOp` 分支，三处即可；
- 更友好的错误：目前 Token 排列错误（如 `a b` 相邻、表达式以运算符结尾）要到求值时才暴露，可以在转换阶段增加一个"期望操作数 / 期望运算符"的状态机，把语法错误提前拦截；
- 结合性：一元 `!` 是右结合的，连续取反需要在弹栈条件中对同优先级做特殊处理；
- 走向更完整的语言：把 RPN 输出换成构建 AST，就有了语法树，函数调用、作用域等概念都可以在其上生长。

一个小语言解释器的全部骨架，不过如此。

## 扩展

最后简单聊三个容易被混用的词：**编译器**、**解释器**、**解析器**。

**解释器**读入源代码，**直接执行得到结果**，不产出可保存的目标程序。本文做的就是解释器：字符串进去，`true` / `false` 出来，中间不生成任何"可以被再次运行的产物"。Python、Shell 也是这个模式。

**编译器**读入源代码，**翻译成另一种语言**（目标代码），翻译和执行是分离的——产物可以保存下来反复运行。TypeScript 编译成 JavaScript、C 编译成机器码，都是这个模式。两者最核心的区别一句话：**解释器的输出是"结果"，编译器的输出是"程序"**。

**解析器**则不是与上面两者并列的概念，而是它们**共用的一个部件**：把 Token 流组织成结构（通常是语法树），回答"这段程序的结构是什么"。也就是说：

```text
源代码
   │  词法分析（本文的 tokenizer）
   ▼
Token 流
   │  语法分析 = 解析器（parser）
   ▼
语法树 / RPN 等中间形式
   ├─ 解释器：遍历它，直接算出结果
   └─ 编译器：遍历它，翻译成另一种语言
```

对照本文：我们为了保持极简，跳过了显式的解析器，把结构信息直接编码进了 RPN 序列；如果把 toRPN 的输出换成构建语法树，那个构建语法树的部分就是解析器。这也是总结里"走向更完整的语言"的第一步。

想看一个解析器的完整示例，可以参考 [json_compiler](https://github.com/DoYoungDo/json_compiler)——一个简单的 JSON 解析器：输入 JSON 文本，先拆成 Token，再把 Token 组织成 JavaScript 对象。"把 Token 流变成结构"这件事，在 JSON 身上体现得比布尔表达式更直观：花括号嵌套对应对象的嵌套，方括号对应数组的层级。

顺带一提，本项目名叫 `when_expression_compiler`，但严格说做的是解释器——起名时图省事，也是很多真实系统的缩影：**编译和解释常常是混合体**。Java 先编译成字节码，再由 JVM 解释执行；V8 会先解释执行 JavaScript，再把热点代码 JIT 编译成机器码。真到 production 级别，"编译还是解释"往往不是二选一，而是"什么时候编译、编译多少"的工程权衡。

## 其它

- **在线演示**：[When 表达式实验室](https://doyoungdo.github.io/when_expression_compiler)——输入任意表达式，逐个动作观察词法扫描、RPN 转换和求值栈的变化；内置的错误示例可以演示每种错误分别在哪一个阶段被发现。
- **源码仓库**：[when_expression_compiler](https://github.com/DoYoungDo/when_expression_compiler)，核心实现在 [`src/index.ts`](../src/index.ts)，运行 `npm test` 可执行全部用例。
- **参考资料**：[VS Code when clause contexts](https://code.visualstudio.com/api/references/when-clause-contexts)——完整 `when` 语法的官方规范，本文实现的语法是它的一个子集。
