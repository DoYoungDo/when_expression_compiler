import { Context, evl, tokenizer } from "./index";



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
        };
        let v = ctx[expression];
        if(!v){
            console.error(`unknown expression:${expression}`)
            return false;
        }
        return v;
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
    ["editorLangId1", true]
];

for (const [exp,res] of expressions) {
    const tokens = tokenizer(exp);
    const result = evl(tokens, context);
    console.log(`${exp} => ${result}\ttest result: ${res} === ${result} => ${res === result}`);
}