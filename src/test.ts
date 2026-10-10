import { strict as assert } from "assert";
import { Context, Expression, evaluate, tokenizer } from "./index";

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
    ["!!isMac", true],
    ["!(isWin || !isMac)", true],
    ["", false],
    ["__undefined_identifer", false],
];

for (const [exp,res] of expressions) {
    const result = Expression.eval(exp, context);
    assert.equal(result, res, exp);
    assert.equal(new Expression(exp).eval(context), res, exp);
    console.log(`${exp} => ${result}\t预期结果:${res}, 测试${res === result ? "成功" : "失败"}`);
}

const invalidExpressions = [
    "editorLangId == 'typescript && ' isMac",
    "isMac isWin", "isMac (isWin)", "(isMac) isWin",
    "isMac !isWin", "isMac &&", "&& isMac", "isMac == == isWin",
    "()", "(isMac", "isMac)", "!", "isMac && ()"
];
const noEvaluation = new class extends Context {
    evlExp(): never { throw new Error("Context must not run for invalid syntax"); }
};
for (const expression of invalidExpressions) {
    assert.throws(() => Expression.eval(expression, noEvaluation), SyntaxError, expression);
    assert.throws(() => new Expression(expression).eval(noEvaluation), SyntaxError, expression);
    assert.throws(() => evaluate(tokenizer(expression), noEvaluation), SyntaxError, expression);
}
