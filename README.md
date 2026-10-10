[English](README.en.md)

# When Expression Compiler

这是一个用于学习简单解释器实现的 TypeScript 项目，用于解释执行 VS Code `when` 表达式。

> [vscode when 表达式规范](https://code.visualstudio.com/api/references/when-clause-contexts)

## 项目结构

- [`src/index.ts`](src/index.ts)：核心类型和错误类定义
- [`src/test.ts`](src/test.ts)：测试用例，用于验证 `when` 表达式的解析结果
- 其他配置文件如 `package.json`、`tsconfig.json` 等用于项目管理和构建配置

## 使用方法

1. 安装依赖：
   ```bash
   npm install
   ```

2. 构建：
   ```bash
   npm run build
   ```

3. 运行测试：
   ```bash
   npm run test
   ```

## 语法校验

词法扫描识别 Token，RPN 转换检查操作数、运算符和括号的排列。
例如 `editorLangId == 'typescript && ' isMac` 的引号配对正确，但字符串与 `isMac` 之间缺少运算符，因此抛出 `SyntaxError`，不会读取上下文或开始求值。
相邻操作数、缺失操作数、空括号和不匹配的括号也会被拒绝；空表达式仍返回 `false`。
`npm test` 使用断言验证结果和非法语法，失败时以非零退出码退出。
HTML 教学原型维护独立的浏览器实现，修改解析规则时需同步检查，不能假设它直接调用 `src/index.ts`。

## 贡献

欢迎提交 Pull Request 或报告问题。请遵循项目的编码规范并确保测试通过。

## 许可证

该项目遵循 MIT 许可证。详情请查看 `LICENSE` 文件。
