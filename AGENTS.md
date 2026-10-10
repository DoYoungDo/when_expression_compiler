# AGENTS.md

## 项目概览

这是一个小型 TypeScript 项目，用于解释执行 VS Code `when` 表达式。核心流程是：

1. `tokenizer` 将输入字符串转换为词法单元。
2. `evaluate` 使用逆波兰表达式（RPN）处理运算符优先级并求值。
3. `Context` 由调用方提供变量解析和可选的运算符实现。
4. `Expression` 提供面向对象和静态两种调用入口。

当前项目没有框架、打包器、数据库、运行时服务或独立资源目录。修改应保持这个轻量结构，除非需求明确要求引入新工具。

## 项目结构

- `src/index.ts`：核心实现，包含 `SyntaxKind`、`Token`、错误类、词法扫描器、RPN 求值器、`Context` 和 `Expression`。
- `src/test.ts`：可执行的手工测试脚本，定义测试上下文和表达式样例。
- `package.json`：npm 元数据及 `watch`、`build`、`test` 脚本。
- `package-lock.json`：npm 依赖锁定文件；依赖变更时与 `package.json` 一起更新。
- `tsconfig.json`：TypeScript 编译配置，包含 `src/**/*`，输出到 `out/`。
- `README.md`、`README.en.md`：中文和英文项目说明、使用方式及结构说明。
- `.vscode/launch.json`：用于调试编译后的 `out/test.js`。
- `.gitignore`：忽略 `node_modules/` 和编译输出 `out/`。
- `LICENSE`：MIT 许可证。

没有专用的 `tests/`、`test/`、`fixtures/`、`assets/` 或 `resources/` 目录；测试目前与源码放在 `src/` 中，运行时资源也不存在。

## 环境与依赖

- 使用 Node.js 和 npm。
- 安装依赖：`npm install`。
- TypeScript 编译器由当前开发依赖或环境提供；不要把 `node_modules/` 或 `out/` 提交到 Git。
- 项目使用 CommonJS 模块，目标 ECMAScript 2016。

## 构建、检查与测试

常用命令：

```bash
npm install                 # 安装依赖
npm run build               # 执行 tsc -b，输出到 out/
npm test                    # 构建后执行 node out/test.js
npm run watch               # 执行 tsc -b -w，持续编译
```

本仓库没有 `lint`、`format`、Jest、Vitest、Mocha 或其他测试脚本。不要假定存在 `npm run lint` 或测试名称过滤功能。提交前至少运行 `npm run build` 和 `npm test`。

### 单个测试

当前 `src/test.ts` 是一个脚本，不是测试框架中的独立用例集合，因此没有官方的单测试命令或 `--grep` 过滤器。若只需验证一个场景：

1. 临时在 `src/test.ts` 中保留或新增目标表达式。
2. 执行 `npm run build`。
3. 执行 `node out/test.js`。
4. 验证后移除临时调试改动，除非它属于正式回归测试。

也可以直接运行 `node out/test.js`，但这要求 `out/` 已由最新源码构建。VS Code 调试配置同样启动 `out/test.js`。

## TypeScript 与代码风格

- 遵循 `tsconfig.json` 的 `strict: true`、`forceConsistentCasingInFileNames: true` 和 `skipLibCheck: true`。
- 源代码使用 4 个空格缩进；保持现有文件的缩进和括号风格，避免无关的全文件格式化。
- 项目目前没有 Prettier、ESLint 或 EditorConfig；格式化以现有代码和 TypeScript 可读性为准。
- 文件名使用小写短名称；类、接口和枚举使用 PascalCase，如 `Context`、`Expression`、`Token`。
- 函数、方法、局部变量使用 camelCase，如 `tokenizer`、`evaluate`、`operatorStack`。
- `SyntaxKind` 枚举成员使用全大写下划线命名；运算符文本保持 VS Code `when` 表达式语法。
- 类型优先使用明确的 TypeScript 类型。公共 API 的参数和返回值必须有类型；不要新增无必要的 `any`。
- 现有 API 的 `Context.evlExp` 和 `Context.evlOp` 使用 `any` 以支持调用方上下文；修改时先评估兼容性，不要随意改变公共签名。
- 使用 `readonly` 表示不会重新绑定的词法单元字段；不要绕过类型系统使用无关的类型断言。

## Imports 与模块

- 使用 TypeScript/ES module 语法，由编译器输出 CommonJS。
- 导入优先使用相对路径和明确的命名导入，例如 `import { Context } from "./index"`。
- 保持 import 位于文件顶部；删除未使用的导入。
- 不要新增路径别名、动态 require 或新的模块系统，除非同步更新 `tsconfig.json` 并有明确需求。
- 当前核心文件没有外部运行时依赖；扩展依赖前先确认是否能用现有标准能力解决。

## 实现约定

- 修改表达式语法时，同时检查词法扫描、运算符优先级、RPN 求值和测试样例。
- 新增运算符时，至少同步更新 `SyntaxKind`、`tokenizer`、优先级表、单目/二元运算符识别及 `Context.evlOp`。
- 变量通过 `Context.evlExp` 解析；不要在解析器中硬编码业务上下文变量。
- 字符串使用单引号，正则表达式使用 `/.../`；数字、标识符、括号和逻辑/比较运算符遵循现有词法规则。
- 保持 `Expression.eval(input, context)` 和实例方法 `new Expression(input).eval(context)` 的行为一致。
- 代码注释可使用中文，并应解释词法、优先级或求值等非显然逻辑；避免为简单赋值添加冗余注释。

## 错误处理

- 词法错误使用现有 `PositionError` 或 `RangeError`，并尽量提供原始输入、位置和可定位的提示。
- 未知运算符应继续通过错误抛出，而不是静默返回错误值。
- 不要用宽泛的 `try/catch` 吞掉解析、正则构造或上下文运算错误；只有在能补充上下文或明确转换错误时才捕获。
- 上下文无法解析变量时，遵循现有测试约定返回 `false` 并记录诊断；不要改变该约定而不补充测试和文档。
- 修改错误消息时保留对调用方有用的输入片段和定位信息，并更新相关测试。

## 协作规则

- 修改前先阅读相关源码、README 和 `tsconfig.json`，确认行为而不是凭名称推断。
- 保持提交范围小而聚焦；不要把生成的 `out/`、依赖目录或编辑器临时文件纳入提交。
- 代码变更应同时更新必要的测试和中英文 README；纯文档改动不应顺带重排源码。
- 提交前运行 `npm run build` 与 `npm test`，并检查 `git diff` 和 `git status`。
- 若发现现有行为疑似错误，先用回归测试固定预期，再修改实现；不要为了让测试通过而降低类型检查或删除断言。
- 本仓库没有额外的 Cursor、Copilot 或 Claude Code 规则文件；本文件是当前项目级代理协作说明的唯一来源。
