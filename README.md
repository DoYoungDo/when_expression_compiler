# When Expression Compiler

这是一个简单的 When 表达式编译器项目，用于解析和验证特定语法的 `when` 表达式。

## 特性

- 定义了语法种类（`SyntaxKind`）
- 提供了位置错误（`PositionError`）和标记错误（`TokenError`）类用于错误处理
- 包含测试用例来验证表达式解析的正确性

## 项目结构

- `src/index.ts`：核心类型和错误类定义
- `src/test.ts`：测试用例，用于验证 `when` 表达式的解析结果
- 其他配置文件如 `package.json`、`tsconfig.json` 等用于项目管理和构建配置

## 使用方法

1. 安装依赖：
   ```bash
   npm install
   ```

2. 运行测试：
   ```bash
   npm test
   ```

## 贡献

欢迎提交 Pull Request 或报告问题。请遵循项目的编码规范并确保测试通过。

## 许可证

该项目遵循 MIT 许可证。详情请查看 `LICENSE` 文件。