[English](README.en.md)

# When Expression Compiler

这是一个简单的 When 表达式编译器项目，用于解析和执行 vscode `when` 表达式。

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

## 贡献

欢迎提交 Pull Request 或报告问题。请遵循项目的编码规范并确保测试通过。

## 许可证

该项目遵循 MIT 许可证。详情请查看 `LICENSE` 文件。