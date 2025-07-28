import { Context, evl, tokenizer } from "./index";



const context: Context = {
    evlExp(expression: string) {
        const ctx: Record<string, any> = {
            editorLangId: "typescript",
            resourceScheme: "untitle",
            gitOpenRepositoryCount: 1,
            workspaceFolderCount: 1,
            resourceFilename: "readme1.md",
            supportedFolders: ["readme.md", "main.ts"],
            isMac: true,
        };
        return ctx[expression];
    },
    evlOp(operator: string, left: any, right: any) {
        switch (operator) {
            case "==": return left === right;
            case "!=": return left !== right;
            case ">": return left > right;
            case "<": return left < right;
            case "in": return Array.isArray(right) && right.includes(left);
            case "not in": return Array.isArray(right) && !right.includes(left);
            case "=~": return new RegExp(right).test(left);
            case "&&": return left && right;
            case "||": return left || right;
            default: throw new Error(`Unknown operator: ${operator}`);
        }
    }
};

// 执行测试表达式
const expressions: [string, boolean][] = [
    ["editorLangId == 'typescript'", true],
    ["resourceScheme =~ /file/", false],
    ["editorLangId == 'typescript' && isMac", true],
    ["resourceFilename in supportedFolders", false],
    ["resourceFilename not in supportedFolders", true],
    ["workspaceFolderCount > 0 && gitOpenRepositoryCount < 2", true],
    ["workspaceFolderCount > 0 && (gitOpenRepositoryCount > 2 || isMac)", true],
    ["isMac", true],
    ["editorLangId", true]
];

for (const [exp,res] of expressions) {
    const tokens = tokenizer(exp);
    const result = evl(tokens, context);
    console.log(`${exp} => ${result}\ttest result: ${res} === ${result} => ${res === result}`);
}