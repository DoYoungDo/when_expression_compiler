[English](README.en.md)

# When Expression Compiler

这是一个不到500行（含测试代码）的简单的 When 表达式解释器项目，用于解释执行 vscode `when` 表达式。

> [vscode when 表达式规范](https://code.visualstudio.com/api/references/when-clause-contexts)

## 在线体验

打开 [When 表达式实验室](https://doyoungdo.github.io/when_expression_compiler)，无需安装依赖即可交互式学习解释器原理。

1. 选择内置示例或输入自己的 `when` 表达式，设置运行上下文变量。
2. 在 Tokens、RPN 转换和求值栈面板中，点击“下个动作”，逐步观察字符扫描、优先级处理和运算过程。
3. 尝试错误示例，查看词法分析、语法检查或求值阶段如何发现并报告错误。

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

## 贡献

欢迎提交 Pull Request 或报告问题。请遵循项目的编码规范并确保测试通过。

## 许可证

该项目遵循 MIT 许可证。详情请查看 `LICENSE` 文件。
