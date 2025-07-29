import { Context, Expression, tokenizer } from "./index";

const context: Context = new class extends Context {
    evlExp(expression: string) {
        const ctx: Record<string, any> = {
            editorLangId: "typescript",
            resourceScheme: "untitle",
            gitOpenRepositoryCount: 1,
            workspaceFolderCount: 1,
            resourceFilename: "readme1.md",
            supportedFolders: ["readme.md", "main.ts"],
            isMac: true,
            isWin: false
        };
        let v = ctx[expression];
        if(v === undefined){
            console.error(`unknown expression:${expression}`)
            return false;
        }
        return v;
    }
};

// 执行测试表达式
const expressions: [string, boolean][] = [
    ["editorLangId == 'typescript' || editorLangId === 'typescript'", true],
    ["editorLangId != 'typescript' || editorLangId !== 'typescript'", false],
    ["resourceScheme =~ /file/", false],
    ["editorLangId == 'typescript' && isMac", true],
    ["resourceFilename in supportedFolders", false],
    ["resourceFilename not in supportedFolders", true],
    ["workspaceFolderCount > 0 && gitOpenRepositoryCount < 2", true],
    ["workspaceFolderCount > 0 && (gitOpenRepositoryCount >= 1 || isMac)", true],
    ["workspaceFolderCount > 0 && (gitOpenRepositoryCount > 1 || isWin)", false],
    ["isMac", true],
    ["isWin", false],
    ["__undefined_identifer", false],
];

for (const [exp,res] of expressions) {
    const result = Expression.eval(exp, context);
    console.log(`${exp} => ${result}\t预期结果:${res}, 测试${res === result ? "成功" : "失败"}`);
}